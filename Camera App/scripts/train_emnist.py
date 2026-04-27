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
DIGITS_TFLITE = os.path.join(ASSETS_DIR, "emnist-digits.tflite")

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


def load_emnist_digits():
    """Load MNIST digits dataset (0-9). We'll filter to 1-9 in the app."""
    (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
    return x_train, y_train, x_test, y_test, 10


def build_model(num_classes):
    """Build a small CNN for 28×28 grayscale character classification."""
    model = keras.Sequential([
        layers.Input(shape=(28, 28, 1)),
        layers.Conv2D(32, 3, activation='relu', padding='same'),
        layers.MaxPooling2D(2),
        layers.Conv2D(64, 3, activation='relu', padding='same'),
        layers.MaxPooling2D(2),
        layers.Conv2D(64, 3, activation='relu', padding='same'),
        layers.Flatten(),
        layers.Dropout(0.3),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax'),
    ])

    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy'],
    )
    return model


def train_and_export(name, x_train, y_train, x_test, y_test, num_classes, output_path):
    """Train model and export to TFLite."""
    print(f"\n{'='*60}")
    print(f"Training {name} model ({num_classes} classes)")
    print(f"{'='*60}")

    # Preprocess
    x_train = x_train.astype('float32') / 255.0
    x_test = x_test.astype('float32') / 255.0
    x_train = x_train.reshape(-1, 28, 28, 1)
    x_test = x_test.reshape(-1, 28, 28, 1)

    print(f"Train: {x_train.shape}, Test: {x_test.shape}")

    # Build and train
    model = build_model(num_classes)
    model.summary()

    model.fit(
        x_train, y_train,
        validation_data=(x_test, y_test),
        epochs=10,
        batch_size=128,
        verbose=1,
    )

    # Evaluate
    loss, acc = model.evaluate(x_test, y_test, verbose=0)
    print(f"\n[RESULT] {name} — Test accuracy: {acc:.4f} ({acc*100:.1f}%)")

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
    print("=" * 60)
    print("EMNIST Model Training for Little Letters App")
    print("=" * 60)

    # Train Letters model (A-Z) — MUST be 26 classes
    x_train, y_train, x_test, y_test, n_classes = load_emnist_letters()
    assert n_classes == 26, f"Letters model must have 26 classes, got {n_classes}!"
    print(f"[CHECK] Letters dataset: {n_classes} classes ✓")
    letters_acc = train_and_export(
        "Letters (A-Z)", x_train, y_train, x_test, y_test, n_classes, LETTERS_TFLITE
    )

    # Verify exported letters model has 26 output classes
    interpreter = tf.lite.Interpreter(model_path=LETTERS_TFLITE)
    interpreter.allocate_tensors()
    out_shape = interpreter.get_output_details()[0]['shape']
    assert out_shape[-1] == 26, f"Letters .tflite has {out_shape[-1]} outputs, expected 26!"
    print(f"[CHECK] Letters .tflite output shape: {out_shape} ✓")

    # Train Digits model (0-9)
    x_train, y_train, x_test, y_test, n_classes = load_emnist_digits()
    assert n_classes == 10, f"Digits model must have 10 classes, got {n_classes}!"
    digits_acc = train_and_export(
        "Digits (0-9)", x_train, y_train, x_test, y_test, n_classes, DIGITS_TFLITE
    )

    print("\n" + "=" * 60)
    print("DONE!")
    print(f"  Letters accuracy: {letters_acc*100:.1f}%")
    print(f"  Digits accuracy:  {digits_acc*100:.1f}%")
    print(f"  Output: {LETTERS_TFLITE}")
    print(f"  Output: {DIGITS_TFLITE}")
    print("=" * 60)


if __name__ == '__main__':
    main()
