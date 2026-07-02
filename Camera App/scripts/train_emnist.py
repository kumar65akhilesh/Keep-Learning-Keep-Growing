"""
Train an EMNIST handwriting recognition model and export to TFLite.

Trains two models:
  1. EMNIST Letters (A-Z) — 26 classes
  2. EMNIST Digits (0-9) — 10 classes (but we only use 1-9)

Each model is a small CNN (~200KB) optimized for mobile inference.
Input: 28×28 grayscale image (white character on black background).
Output: probability distribution over character classes.

Usage:
  pip install tensorflow numpy
  python scripts/train_emnist.py
"""

import os
import sys
import time
import argparse

def install_deps():
    """Install required packages if not present."""
    try:
        import tensorflow  # noqa: F401
        import numpy  # noqa: F401
    except ImportError:
        print("[SETUP] Installing tensorflow and numpy (this may take a few minutes)...")
        os.system(f'"{sys.executable}" -m pip install tensorflow numpy')

install_deps()

import numpy as np

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# ─── Output paths ─────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
ASSETS_DIR = os.path.join(PROJECT_DIR, "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

LETTERS_TFLITE = os.path.join(ASSETS_DIR, "emnist-letters.tflite")
LETTERS_LOWER_TFLITE = os.path.join(ASSETS_DIR, "emnist-letters-lower.tflite")
DIGITS_TFLITE = os.path.join(ASSETS_DIR, "emnist-digits.tflite")

LOWER_LABELS = 'abcdefghijklmnopqrstuvwxyz'

# ─── EMNIST Letters ───────────────────────────────────────────────

def load_emnist_letters():
    """
    Load EMNIST Letters dataset (26 classes, A-Z).
    Tries multiple download strategies:
      1. `emnist` pip package (most reliable)
      2. Manual download from NIST gzip mirror
      3. tensorflow_datasets
    Raises if all fail — never silently falls back to digits.
    """

    # ── Strategy 1: emnist pip package ────────────────────────────
    try:
        try:
            from emnist import extract_training_samples, extract_test_samples
        except ImportError:
            print("[INFO] Installing 'emnist' package...")
            os.system(f'"{sys.executable}" -m pip install emnist')
            from emnist import extract_training_samples, extract_test_samples

        print("[INFO] Loading EMNIST Letters via emnist package...")
        x_train, y_train = extract_training_samples('letters')
        x_test, y_test = extract_test_samples('letters')

        # emnist package labels: 1-26 (A=1, Z=26) → shift to 0-25
        y_train = y_train - 1
        y_test = y_test - 1

        print(f"  Train: {x_train.shape}, labels range: {y_train.min()}-{y_train.max()}")
        print(f"  Test:  {x_test.shape},  labels range: {y_test.min()}-{y_test.max()}")
        assert y_train.max() == 25, f"Expected 26 classes (0-25), got max label {y_train.max()}"
        return x_train, y_train, x_test, y_test, 26
    except Exception as e1:
        print(f"[WARN] emnist package failed: {e1}")

    # ── Strategy 2: Manual NIST gzip download ─────────────────────
    try:
        import urllib.request
        import gzip
        import struct

        MIRRORS = [
            "https://biometrics.nist.gov/cs_links/EMNIST/gzip/",
            "https://www.itl.nist.gov/iaui/vip/cs_links/EMNIST/gzip/",
        ]
        files = {
            "train_images": "emnist-letters-train-images-idx3-ubyte.gz",
            "train_labels": "emnist-letters-train-labels-idx1-ubyte.gz",
            "test_images": "emnist-letters-test-images-idx3-ubyte.gz",
            "test_labels": "emnist-letters-test-labels-idx1-ubyte.gz",
        }

        cache_dir = os.path.join(PROJECT_DIR, ".emnist_cache")
        os.makedirs(cache_dir, exist_ok=True)

        def download_file(filename):
            filepath = os.path.join(cache_dir, filename)
            if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
                return filepath
            for base_url in MIRRORS:
                try:
                    url = base_url + filename
                    print(f"  Downloading {url} ...")
                    urllib.request.urlretrieve(url, filepath)
                    if os.path.getsize(filepath) > 1000:
                        return filepath
                except Exception:
                    continue
            raise RuntimeError(f"Could not download {filename} from any mirror")

        def parse_images(filename):
            filepath = download_file(filename)
            with gzip.open(filepath, 'rb') as f:
                magic, num, rows, cols = struct.unpack('>IIII', f.read(16))
                data = np.frombuffer(f.read(), dtype=np.uint8).reshape(num, rows, cols)
            # EMNIST images are stored column-major → transpose to row-major
            data = np.transpose(data, (0, 2, 1))
            return data

        def parse_labels(filename):
            filepath = download_file(filename)
            with gzip.open(filepath, 'rb') as f:
                magic, num = struct.unpack('>II', f.read(8))
                labels = np.frombuffer(f.read(), dtype=np.uint8)
            return labels

        print("[INFO] Downloading EMNIST Letters from NIST mirrors...")
        x_train = parse_images(files["train_images"])
        y_train = parse_labels(files["train_labels"])
        x_test = parse_images(files["test_images"])
        y_test = parse_labels(files["test_labels"])

        # Labels are 1-26, shift to 0-25
        y_train = y_train - 1
        y_test = y_test - 1

        print(f"  Train: {x_train.shape}, labels range: {y_train.min()}-{y_train.max()}")
        print(f"  Test:  {x_test.shape},  labels range: {y_test.min()}-{y_test.max()}")
        assert y_train.max() == 25, f"Expected 26 classes (0-25), got max label {y_train.max()}"
        return x_train, y_train, x_test, y_test, 26
    except Exception as e2:
        print(f"[WARN] NIST mirror download failed: {e2}")

    # ── Strategy 3: tensorflow_datasets ───────────────────────────
    try:
        import tensorflow_datasets as tfds
        print("[INFO] Loading EMNIST Letters via tensorflow_datasets...")
        ds_train = tfds.load('emnist/letters', split='train', as_supervised=True)
        ds_test = tfds.load('emnist/letters', split='test', as_supervised=True)

        x_train, y_train = [], []
        for img, label in ds_train:
            x_train.append(img.numpy().squeeze())
            y_train.append(label.numpy())
        x_train = np.array(x_train)
        y_train = np.array(y_train)

        x_test, y_test = [], []
        for img, label in ds_test:
            x_test.append(img.numpy().squeeze())
            y_test.append(label.numpy())
        x_test = np.array(x_test)
        y_test = np.array(y_test)

        # tfds labels are 1-26, shift to 0-25
        y_train = y_train - 1
        y_test = y_test - 1

        print(f"  Train: {x_train.shape}, labels range: {y_train.min()}-{y_train.max()}")
        assert y_train.max() == 25, f"Expected 26 classes (0-25), got max label {y_train.max()}"
        return x_train, y_train, x_test, y_test, 26
    except Exception as e3:
        print(f"[WARN] tensorflow_datasets API failed: {e3}")

    # ── Strategy 4: Load directly from tfrecord files ─────────────
    try:
        tfrecord_dir = os.path.join(
            os.path.expanduser("~"), "tensorflow_datasets", "emnist", "letters", "3.1.0"
        )
        train_path = os.path.join(tfrecord_dir, "emnist-train.tfrecord-00000-of-00001")
        test_path = os.path.join(tfrecord_dir, "emnist-test.tfrecord-00000-of-00001")

        if os.path.exists(train_path) and os.path.exists(test_path):
            print("[INFO] Loading EMNIST Letters directly from tfrecord files...")

            feature_desc = {
                'image': tf.io.FixedLenFeature([], tf.string),
                'label': tf.io.FixedLenFeature([], tf.int64),
            }

            def parse_fn(example_proto):
                parsed = tf.io.parse_single_example(example_proto, feature_desc)
                # tfds stores images as PNG-encoded bytes
                image = tf.io.decode_png(parsed['image'], channels=1)
                image = tf.squeeze(image)  # (28, 28)
                return image, parsed['label']

            def load_from_tfrecord(path):
                dataset = tf.data.TFRecordDataset(path)
                images, labels = [], []
                for raw in dataset:
                    img, lbl = parse_fn(raw)
                    images.append(img.numpy())
                    labels.append(lbl.numpy())
                return np.array(images), np.array(labels)

            x_train, y_train = load_from_tfrecord(train_path)
            x_test, y_test = load_from_tfrecord(test_path)

            # tfds labels are 1-26, shift to 0-25
            y_train = y_train - 1
            y_test = y_test - 1

            print(f"  Train: {x_train.shape}, labels range: {y_train.min()}-{y_train.max()}")
            print(f"  Test:  {x_test.shape},  labels range: {y_test.min()}-{y_test.max()}")
            assert y_train.max() == 25, f"Expected 26 classes, got max label {y_train.max()}"
            return x_train, y_train, x_test, y_test, 26
        else:
            print(f"[WARN] tfrecord files not found at {tfrecord_dir}")
    except Exception as e4:
        print(f"[WARN] Direct tfrecord loading failed: {e4}")

    # ── All strategies failed — DO NOT fall back to digits ────────
    raise RuntimeError(
        "FATAL: Could not load EMNIST Letters from any source.\n"
        "Try: pip install emnist\n"
        "Or manually download from https://www.nist.gov/itl/products-and-services/emnist-dataset"
    )


# ─── EMNIST ByClass (uppercase-only / lowercase-only) ────────────

def load_emnist_byclass():
    """
    Load EMNIST ByClass dataset (62 classes: 0-9, A-Z, a-z).
    Returns x_train, y_train, x_test, y_test with labels 0-61.
    """
    # ── Strategy 1: emnist pip package (with cache-clear retry) ───
    try:
        try:
            from emnist import extract_training_samples, extract_test_samples
        except ImportError:
            print("[INFO] Installing 'emnist' package...")
            os.system(f'"{sys.executable}" -m pip install emnist')
            from emnist import extract_training_samples, extract_test_samples

        print("[INFO] Loading EMNIST ByClass via emnist package...")
        try:
            x_train, y_train = extract_training_samples('byclass')
            x_test, y_test = extract_test_samples('byclass')
        except Exception as e_zip:
            # Corrupted cache — clear it and retry
            print(f"[WARN] emnist cache may be corrupted ({e_zip}), clearing...")
            import emnist as emnist_mod
            cache_candidates = [
                os.path.join(os.path.dirname(emnist_mod.__file__), 'data'),
                os.path.join(os.path.dirname(emnist_mod.__file__)),
            ]
            for d in cache_candidates:
                if not os.path.isdir(d):
                    continue
                for f in os.listdir(d):
                    if 'byclass' in f.lower() or f.endswith('.gz') or f.endswith('.zip'):
                        path = os.path.join(d, f)
                        print(f"  Removing cached file: {path}")
                        os.remove(path)
            # Also clear any user-level cache
            import shutil
            user_cache = os.path.join(os.path.expanduser("~"), ".cache", "emnist")
            if os.path.isdir(user_cache):
                print(f"  Clearing user cache: {user_cache}")
                shutil.rmtree(user_cache, ignore_errors=True)
            # Retry
            x_train, y_train = extract_training_samples('byclass')
            x_test, y_test = extract_test_samples('byclass')

        # emnist package returns raw column-major images — transpose to row-major
        # so the model learns correctly-oriented characters (matching native module output).
        x_train = x_train.reshape(-1, 28, 28).transpose(0, 2, 1).reshape(-1, 28, 28)
        x_test = x_test.reshape(-1, 28, 28).transpose(0, 2, 1).reshape(-1, 28, 28)

        print(f"  ByClass Train: {x_train.shape}, labels range: {y_train.min()}-{y_train.max()}")
        print(f"  ByClass Test:  {x_test.shape},  labels range: {y_test.min()}-{y_test.max()}")
        return x_train, y_train, x_test, y_test
    except Exception as e1:
        print(f"[WARN] emnist ByClass via pip failed: {e1}")

    # ── Strategy 2: Manual NIST gzip download ─────────────────────
    try:
        import urllib.request
        import gzip
        import struct

        MIRRORS = [
            "https://biometrics.nist.gov/cs_links/EMNIST/gzip/",
            "https://www.itl.nist.gov/iaui/vip/cs_links/EMNIST/gzip/",
        ]
        files = {
            "train_images": "emnist-byclass-train-images-idx3-ubyte.gz",
            "train_labels": "emnist-byclass-train-labels-idx1-ubyte.gz",
            "test_images": "emnist-byclass-test-images-idx3-ubyte.gz",
            "test_labels": "emnist-byclass-test-labels-idx1-ubyte.gz",
        }

        cache_dir = os.path.join(PROJECT_DIR, ".emnist_cache")
        os.makedirs(cache_dir, exist_ok=True)

        def download_file(filename):
            filepath = os.path.join(cache_dir, filename)
            if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
                return filepath
            for base_url in MIRRORS:
                try:
                    url = base_url + filename
                    print(f"  Downloading {url} ...")
                    urllib.request.urlretrieve(url, filepath)
                    if os.path.getsize(filepath) > 1000:
                        return filepath
                except Exception:
                    continue
            raise RuntimeError(f"Could not download {filename} from any mirror")

        def parse_images(filename):
            filepath = download_file(filename)
            with gzip.open(filepath, 'rb') as f:
                magic, num, rows, cols = struct.unpack('>IIII', f.read(16))
                data = np.frombuffer(f.read(), dtype=np.uint8).reshape(num, rows, cols)
            data = np.transpose(data, (0, 2, 1))
            return data

        def parse_labels(filename):
            filepath = download_file(filename)
            with gzip.open(filepath, 'rb') as f:
                magic, num = struct.unpack('>II', f.read(8))
                labels = np.frombuffer(f.read(), dtype=np.uint8)
            return labels

        print("[INFO] Downloading EMNIST ByClass from NIST mirrors...")
        x_train = parse_images(files["train_images"])
        y_train = parse_labels(files["train_labels"])
        x_test = parse_images(files["test_images"])
        y_test = parse_labels(files["test_labels"])

        print(f"  ByClass Train: {x_train.shape}, labels range: {y_train.min()}-{y_train.max()}")
        print(f"  ByClass Test:  {x_test.shape},  labels range: {y_test.min()}-{y_test.max()}")
        return x_train, y_train, x_test, y_test
    except Exception as e2:
        print(f"[WARN] NIST ByClass mirror download failed: {e2}")

    # ── Strategy 3: tensorflow_datasets ───────────────────────────
    try:
        try:
            import tensorflow_datasets as tfds
        except ImportError:
            print("[INFO] Installing tensorflow_datasets...")
            os.system(f'"{sys.executable}" -m pip install tensorflow_datasets')
            import tensorflow_datasets as tfds

        print("[INFO] Loading EMNIST ByClass via tensorflow_datasets...")
        ds_train = tfds.load('emnist/byclass', split='train', as_supervised=True)
        ds_test = tfds.load('emnist/byclass', split='test', as_supervised=True)

        x_train, y_train = [], []
        for img, label in ds_train:
            x_train.append(img.numpy().squeeze())
            y_train.append(label.numpy())
        x_train = np.array(x_train)
        y_train = np.array(y_train)

        x_test, y_test = [], []
        for img, label in ds_test:
            x_test.append(img.numpy().squeeze())
            y_test.append(label.numpy())
        x_test = np.array(x_test)
        y_test = np.array(y_test)

        print(f"  ByClass Train: {x_train.shape}, labels range: {y_train.min()}-{y_train.max()}")
        print(f"  ByClass Test:  {x_test.shape},  labels range: {y_test.min()}-{y_test.max()}")
        return x_train, y_train, x_test, y_test
    except Exception as e3:
        print(f"[WARN] tensorflow_datasets ByClass failed: {e3}")

    # ── Strategy 4: Load directly from tfds tfrecord files ────────
    # tfds may have downloaded the data but failed on the API layer
    # (e.g. protobuf version mismatch). Parse the raw tfrecords.
    try:
        import glob

        tfrecord_dir = os.path.join(
            os.path.expanduser("~"), "tensorflow_datasets", "emnist", "byclass", "3.1.0"
        )

        if not os.path.isdir(tfrecord_dir):
            raise FileNotFoundError(f"tfrecord dir not found: {tfrecord_dir}")

        train_files = sorted(glob.glob(os.path.join(tfrecord_dir, "emnist-train.tfrecord*")))
        test_files = sorted(glob.glob(os.path.join(tfrecord_dir, "emnist-test.tfrecord*")))

        if not train_files or not test_files:
            raise FileNotFoundError(f"No tfrecord files found in {tfrecord_dir}")

        print(f"[INFO] Loading EMNIST ByClass from tfrecord files ({len(train_files)} train, {len(test_files)} test)...")

        feature_desc = {
            'image': tf.io.FixedLenFeature([], tf.string),
            'label': tf.io.FixedLenFeature([], tf.int64),
        }

        def parse_fn(example_proto):
            parsed = tf.io.parse_single_example(example_proto, feature_desc)
            image = tf.io.decode_png(parsed['image'], channels=1)
            image = tf.squeeze(image)  # (28, 28)
            return image, parsed['label']

        def load_from_tfrecords(file_list):
            dataset = tf.data.TFRecordDataset(file_list, buffer_size=8*1024*1024)
            dataset = dataset.map(parse_fn, num_parallel_calls=tf.data.AUTOTUNE)
            dataset = dataset.batch(10000).prefetch(2)
            images, labels = [], []
            count = 0
            for img_batch, lbl_batch in dataset:
                images.append(img_batch.numpy())
                labels.append(lbl_batch.numpy())
                count += len(img_batch)
                print(f"\r  Loaded {count} samples...", end="", flush=True)
            print()
            return np.concatenate(images), np.concatenate(labels)

        x_train, y_train = load_from_tfrecords(train_files)
        x_test, y_test = load_from_tfrecords(test_files)

        print(f"  ByClass Train: {x_train.shape}, labels range: {y_train.min()}-{y_train.max()}")
        print(f"  ByClass Test:  {x_test.shape},  labels range: {y_test.min()}-{y_test.max()}")
        return x_train, y_train, x_test, y_test
    except Exception as e4:
        print(f"[WARN] Direct tfrecord loading failed: {e4}")

    raise RuntimeError(
        "FATAL: Could not load EMNIST ByClass from any source.\n"
        "Try one of:\n"
        "  pip install emnist\n"
        "  pip install tensorflow_datasets"
    )


def _filter_uppercase(x_train, y_train, x_test, y_test):
    """
    Filter ByClass data to only uppercase letters (A-Z).
    ByClass labels: 10=A, 11=B, ..., 35=Z → remap to 0-25.
    Returns 26 classes.
    """
    # Filter to labels 10-35 (uppercase A-Z)
    train_mask = (y_train >= 10) & (y_train <= 35)
    test_mask = (y_test >= 10) & (y_test <= 35)

    x_train, y_train = x_train[train_mask], y_train[train_mask] - 10
    x_test, y_test = x_test[test_mask], y_test[test_mask] - 10

    print(f"  Uppercase Train: {x_train.shape}, labels range: {y_train.min()}-{y_train.max()}")
    print(f"  Uppercase Test:  {x_test.shape},  labels range: {y_test.min()}-{y_test.max()}")
    assert y_train.max() == 25, f"Expected 26 classes (0-25), got max label {y_train.max()}"
    return x_train, y_train, x_test, y_test, 26


def _filter_lowercase(x_train, y_train, x_test, y_test):
    """
    Filter ByClass data to only lowercase letters (a-z).
    ByClass labels: 36=a, 37=b, ..., 61=z → remap to 0-25.
    Returns 26 classes.
    """
    # Filter to labels 36-61 (lowercase a-z)
    train_mask = (y_train >= 36) & (y_train <= 61)
    test_mask = (y_test >= 36) & (y_test <= 61)

    x_train, y_train = x_train[train_mask], y_train[train_mask] - 36
    x_test, y_test = x_test[test_mask], y_test[test_mask] - 36

    print(f"  Lowercase Train: {x_train.shape}, labels range: {y_train.min()}-{y_train.max()}")
    print(f"  Lowercase Test:  {x_test.shape},  labels range: {y_test.min()}-{y_test.max()}")
    assert y_train.max() == 25, f"Expected 26 classes (0-25), got max label {y_train.max()}"
    return x_train, y_train, x_test, y_test, 26


def _load_image_28x28_grayscale(path):
    """
    Load one image file as a normalized 28x28 grayscale array (uint8).
    Output convention matches EMNIST preprocessing: white ink on black background.
    """
    raw = tf.io.read_file(path)
    img = tf.io.decode_image(raw, channels=1, expand_animations=False)
    img = tf.image.resize_with_pad(img, 28, 28)
    img = tf.cast(img, tf.float32) / 255.0
    arr = img.numpy().squeeze()

    # Most user photos are dark-ink-on-light-paper; invert to white-on-black.
    if arr.mean() > 0.5:
        arr = 1.0 - arr

    # Stretch dynamic range when possible.
    amin = float(arr.min())
    amax = float(arr.max())
    if amax > amin:
        arr = (arr - amin) / (amax - amin)

    return (arr * 255.0).astype(np.uint8)


def load_custom_lowercase_dataset(root_dir, val_split=0.2, seed=42):
    """
    Load a custom lowercase dataset from folder structure:
      root_dir/
        a/*.png|jpg|jpeg
        b/*.png|jpg|jpeg
        ...
        z/*.png|jpg|jpeg

    Returns train/test arrays in the same shape/style as EMNIST arrays.
    """
    exts = ('.png', '.jpg', '.jpeg')
    rng = np.random.default_rng(seed)

    per_class = {}
    for idx, ch in enumerate(LOWER_LABELS):
        d = os.path.join(root_dir, ch)
        if not os.path.isdir(d):
            continue
        files = [
            os.path.join(d, f)
            for f in os.listdir(d)
            if f.lower().endswith(exts)
        ]
        if files:
            per_class[idx] = files

    if not per_class:
        raise RuntimeError(
            f"No custom lowercase samples found in {root_dir}. "
            "Expected subfolders a..z with image files."
        )

    x_train, y_train, x_test, y_test = [], [], [], []
    print(f"[INFO] Loading custom lowercase samples from {root_dir}")

    for idx in range(26):
        files = per_class.get(idx, [])
        if not files:
            print(f"  [WARN] Missing class '{LOWER_LABELS[idx]}' in custom dataset")
            continue

        files = np.array(files)
        rng.shuffle(files)

        n = len(files)
        n_val = max(1, int(round(n * val_split))) if n > 1 else 0
        val_files = files[:n_val]
        train_files = files[n_val:]
        if len(train_files) == 0 and len(val_files) > 0:
            train_files = val_files[:1]
            val_files = val_files[1:]

        for p in train_files:
            x_train.append(_load_image_28x28_grayscale(p))
            y_train.append(idx)
        for p in val_files:
            x_test.append(_load_image_28x28_grayscale(p))
            y_test.append(idx)

        print(
            f"  class {LOWER_LABELS[idx]}: total={n}, "
            f"train={len(train_files)}, test={len(val_files)}"
        )

    if not x_train:
        raise RuntimeError("Custom lowercase dataset produced empty training set")

    x_train = np.stack(x_train)
    y_train = np.array(y_train, dtype=np.int64)
    x_test = np.stack(x_test) if x_test else np.zeros((0, 28, 28), dtype=np.uint8)
    y_test = np.array(y_test, dtype=np.int64) if y_test else np.zeros((0,), dtype=np.int64)

    print(
        f"[INFO] Custom lowercase loaded: train={x_train.shape[0]} test={x_test.shape[0]}"
    )
    return x_train, y_train, x_test, y_test


def blend_lowercase_data(
    emnist_train_x,
    emnist_train_y,
    emnist_test_x,
    emnist_test_y,
    custom_train_x,
    custom_train_y,
    custom_test_x,
    custom_test_y,
    custom_weight=1.0,
):
    """Blend EMNIST lowercase with custom lowercase samples.

    custom_weight controls how strongly custom samples are emphasized.
    - 1.0 => add once
    - 2.0 => duplicate custom train once (2x presence)
    """
    repeats = max(1, int(round(custom_weight)))
    rep_x = np.concatenate([custom_train_x] * repeats, axis=0)
    rep_y = np.concatenate([custom_train_y] * repeats, axis=0)

    x_train = np.concatenate([emnist_train_x, rep_x], axis=0)
    y_train = np.concatenate([emnist_train_y, rep_y], axis=0)

    if custom_test_x.shape[0] > 0:
        x_test = np.concatenate([emnist_test_x, custom_test_x], axis=0)
        y_test = np.concatenate([emnist_test_y, custom_test_y], axis=0)
    else:
        x_test = emnist_test_x
        y_test = emnist_test_y

    return x_train, y_train, x_test, y_test


def load_emnist_digits():
    """Load MNIST digits dataset (0-9). We'll filter to 1-9 in the app."""
    (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
    return x_train, y_train, x_test, y_test, 10


def build_model(num_classes):
    """Deeper CNN with batch normalization for better generalization."""
    model = keras.Sequential([
        layers.Input(shape=(28, 28, 1)),
        # Block 1: 28×28 → 14×14
        layers.Conv2D(32, 3, padding='same'),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Conv2D(32, 3, padding='same'),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.MaxPooling2D(2),
        layers.Dropout(0.2),
        # Block 2: 14×14 → 7×7
        layers.Conv2D(64, 3, padding='same'),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Conv2D(64, 3, padding='same'),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.MaxPooling2D(2),
        layers.Dropout(0.2),
        # Block 3: 7×7
        layers.Conv2D(128, 3, padding='same'),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        # Classifier
        layers.Flatten(),
        layers.Dropout(0.4),
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        layers.Dense(num_classes, activation='softmax'),
    ])

    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy'],
    )
    return model


def train_and_export(name, x_train, y_train, x_test, y_test, num_classes, output_path):
    """Train model with data augmentation and export to TFLite."""

    print(f"\n{'='*60}")
    print(f"Training {name} model ({num_classes} classes)")
    print(f"{'='*60}")

    # Subsample large datasets for speed (>200K samples has diminishing returns)
    MAX_TRAIN = 200000
    if len(x_train) > MAX_TRAIN:
        print(f"  Subsampling {len(x_train)} → {MAX_TRAIN} training samples for speed")
        rng = np.random.default_rng(42)
        idx = rng.choice(len(x_train), MAX_TRAIN, replace=False)
        x_train = x_train[idx]
        y_train = y_train[idx]

    # Preprocess
    x_train = x_train.astype('float32') / 255.0
    x_test = x_test.astype('float32') / 255.0
    x_train = x_train.reshape(-1, 28, 28, 1)
    x_test = x_test.reshape(-1, 28, 28, 1)

    print(f"Train: {x_train.shape}, Test: {x_test.shape}")

    # Build and train
    model = build_model(num_classes)
    model.summary()

    callbacks = [
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', patience=3, factor=0.5, min_lr=1e-6, verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy', patience=5, restore_best_weights=True, verbose=1
        ),
    ]

    # Use tf.data pipeline with augmentation (Keras 3 compatible)
    batch_size = 1024

    # Augmentation via Keras preprocessing layers
    augmentation = keras.Sequential([
        layers.RandomRotation(10/360, fill_mode='constant', fill_value=0.0),
        layers.RandomTranslation(0.1, 0.1, fill_mode='constant', fill_value=0.0),
        layers.RandomZoom((-0.1, 0.1), fill_mode='constant', fill_value=0.0),
    ])

    train_ds = tf.data.Dataset.from_tensor_slices((x_train, y_train))
    train_ds = train_ds.shuffle(50000, reshuffle_each_iteration=True)
    train_ds = train_ds.batch(batch_size)
    train_ds = train_ds.map(
        lambda x, y: (augmentation(x, training=True), y),
        num_parallel_calls=tf.data.AUTOTUNE
    )
    train_ds = train_ds.prefetch(tf.data.AUTOTUNE)

    val_ds = tf.data.Dataset.from_tensor_slices((x_test, y_test))
    val_ds = val_ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=15,
        callbacks=callbacks,
        verbose=1,
    )

    # Evaluate
    loss, acc = model.evaluate(x_test, y_test, verbose=0)
    print(f"\n[RESULT] {name} — Test accuracy: {acc:.4f} ({acc*100:.1f}%)")

    # Per-class accuracy report
    predictions = model.predict(x_test, verbose=0)
    pred_classes = np.argmax(predictions, axis=1)
    print(f"\n[PER-CLASS] {name}:")
    for c in range(num_classes):
        mask = y_test == c
        if mask.sum() == 0:
            continue
        class_acc = (pred_classes[mask] == c).mean()
        if num_classes == 26:
            label = chr(c + 97) if 'owercase' in name.lower() else chr(c + 65)
        else:
            label = str(c)
        count = mask.sum()
        print(f"  {label}: {class_acc*100:.1f}% ({count} samples)")

    # Convert to TFLite (quantized for smaller size + faster inference)
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    tflite_model = converter.convert()

    with open(output_path, 'wb') as f:
        f.write(tflite_model)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"[SAVED] {output_path} ({size_kb:.0f} KB)")

    return acc


def main():
    import multiprocessing as mp

    parser = argparse.ArgumentParser(description="Train EMNIST/TFLite models for Little Letters")
    parser.add_argument(
        "--custom-lower-dir",
        type=str,
        default="",
        help="Optional path to custom lowercase dataset (subfolders a..z with images)",
    )
    parser.add_argument(
        "--custom-lower-val-split",
        type=float,
        default=0.2,
        help="Validation split for custom lowercase dataset (default: 0.2)",
    )
    parser.add_argument(
        "--custom-lower-weight",
        type=float,
        default=2.0,
        help="Relative weight for custom lowercase training samples (default: 2.0)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed used for custom split/shuffle (default: 42)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("EMNIST Model Training for Little Letters App")
    print("=" * 60)
    print(f"[INFO] CPU count: {mp.cpu_count()}")
    print(f"[INFO] TensorFlow {tf.__version__} (CPU mode)")
    print(f"[INFO] Strategy: optimized sequential (batch=1024, subsample=200K, epochs≤15)")
    if args.custom_lower_dir:
        print(f"[INFO] Custom lowercase dataset: {args.custom_lower_dir}")
        print(f"[INFO] Custom lowercase weight: {args.custom_lower_weight}")
    print()

    t_start = time.time()

    # ── Load datasets (shared step — must happen before forking) ──
    print("[STEP 1/3] Loading datasets...")
    t_load = time.time()
    byclass_data = load_emnist_byclass()
    x_upper, y_upper, xt_upper, yt_upper, nc_upper = _filter_uppercase(*byclass_data)
    x_lower, y_lower, xt_lower, yt_lower, nc_lower = _filter_lowercase(*byclass_data)
    x_digits, y_digits, xt_digits, yt_digits, nc_digits = load_emnist_digits()

    if args.custom_lower_dir:
        c_train_x, c_train_y, c_test_x, c_test_y = load_custom_lowercase_dataset(
            args.custom_lower_dir,
            val_split=args.custom_lower_val_split,
            seed=args.seed,
        )
        x_lower, y_lower, xt_lower, yt_lower = blend_lowercase_data(
            x_lower,
            y_lower,
            xt_lower,
            yt_lower,
            c_train_x,
            c_train_y,
            c_test_x,
            c_test_y,
            custom_weight=args.custom_lower_weight,
        )
        print(
            f"  Lowercase after blend: {x_lower.shape[0]} train, {xt_lower.shape[0]} test"
        )

    print(f"  Datasets loaded in {time.time() - t_load:.1f}s")
    print(f"  Uppercase: {x_upper.shape[0]} train, {xt_upper.shape[0]} test")
    print(f"  Lowercase: {x_lower.shape[0]} train, {xt_lower.shape[0]} test")
    print(f"  Digits:    {x_digits.shape[0]} train, {xt_digits.shape[0]} test")

    # ── Train sequentially but with optimized settings ──
    # (multiprocessing.Pool with TF has issues on Windows — spawn overhead)
    # Instead: train sequentially with speed optimizations (subsampling, larger batch, fewer epochs)
    print("\n[STEP 2/3] Training models...")
    t_train = time.time()

    upper_acc = train_and_export(
        "Uppercase Letters (A-Z)", x_upper, y_upper, xt_upper, yt_upper, nc_upper, LETTERS_TFLITE
    )
    lower_acc = train_and_export(
        "Lowercase Letters (a-z)", x_lower, y_lower, xt_lower, yt_lower, nc_lower, LETTERS_LOWER_TFLITE
    )
    digits_acc = train_and_export(
        "Digits (0-9)", x_digits, y_digits, xt_digits, yt_digits, nc_digits, DIGITS_TFLITE
    )

    print(f"\n  All models trained in {time.time() - t_train:.1f}s")

    # ── Verify exported models ──
    print("\n[STEP 3/3] Verifying exported models...")
    for path, expected, label in [
        (LETTERS_TFLITE, 26, "Uppercase"),
        (LETTERS_LOWER_TFLITE, 26, "Lowercase"),
        (DIGITS_TFLITE, 10, "Digits"),
    ]:
        interpreter = tf.lite.Interpreter(model_path=path)
        interpreter.allocate_tensors()
        out_shape = interpreter.get_output_details()[0]['shape']
        assert out_shape[-1] == expected, f"{label} .tflite has {out_shape[-1]} outputs, expected {expected}!"
        size_kb = os.path.getsize(path) / 1024
        print(f"  ✓ {label}: {out_shape}, {size_kb:.0f} KB")

    total_time = time.time() - t_start
    print("\n" + "=" * 60)
    print("DONE!")
    print(f"  Total time: {total_time/60:.1f} minutes")
    print(f"  Uppercase accuracy: {upper_acc*100:.1f}%")
    print(f"  Lowercase accuracy: {lower_acc*100:.1f}%")
    print(f"  Digits accuracy:    {digits_acc*100:.1f}%")
    print(f"  Output: {LETTERS_TFLITE}")
    print(f"  Output: {LETTERS_LOWER_TFLITE}")
    print(f"  Output: {DIGITS_TFLITE}")
    print("=" * 60)

    if upper_acc < 0.93 or lower_acc < 0.90:
        print("\n⚠️  WARNING: Accuracy below target. Consider:")
        print("  - Removing subsampling (increase MAX_TRAIN)")
        print("  - Increasing epochs (currently 15)")
        print("  - Running on a GPU machine")


if __name__ == '__main__':
    main()
