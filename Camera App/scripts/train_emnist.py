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
    Load EMNIST Letters dataset.
    Falls back to generating synthetic data from MNIST if EMNIST download fails.
    EMNIST Letters: 26 classes (A-Z), 28×28 grayscale images.
    """
    try:
        # Try loading via tensorflow_datasets
        import tensorflow_datasets as tfds
        ds_train = tfds.load('emnist/letters', split='train', as_supervised=True)
        ds_test = tfds.load('emnist/letters', split='test', as_supervised=True)

        x_train, y_train = [], []
        for img, label in ds_train:
            x_train.append(img.numpy())
            y_train.append(label.numpy())
        x_train = np.array(x_train)
        y_train = np.array(y_train)

        x_test, y_test = [], []
        for img, label in ds_test:
            x_test.append(img.numpy())
            y_test.append(label.numpy())
        x_test = np.array(x_test)
        y_test = np.array(y_test)

        # EMNIST letters labels are 1-26 (A=1, Z=26), shift to 0-25
        y_train = y_train - 1
        y_test = y_test - 1

        return x_train, y_train, x_test, y_test, 26
    except Exception as e:
        print(f"[INFO] Could not load EMNIST via tfds ({e}), downloading manually...")

    # Manual download from NIST/Cohen et al. via the gzip files
    try:
        import urllib.request
        import gzip
        import struct

        BASE_URL = "https://biometrics.nist.gov/cs_links/EMNIST/gzip/"
        files = {
            "train_images": "emnist-letters-train-images-idx3-ubyte.gz",
            "train_labels": "emnist-letters-train-labels-idx1-ubyte.gz",
            "test_images": "emnist-letters-test-images-idx3-ubyte.gz",
            "test_labels": "emnist-letters-test-labels-idx1-ubyte.gz",
        }

        cache_dir = os.path.join(PROJECT_DIR, ".emnist_cache")
        os.makedirs(cache_dir, exist_ok=True)

        def download_and_parse_images(filename):
            filepath = os.path.join(cache_dir, filename)
            if not os.path.exists(filepath):
                print(f"  Downloading {filename}...")
                urllib.request.urlretrieve(BASE_URL + filename, filepath)
            with gzip.open(filepath, 'rb') as f:
                magic, num, rows, cols = struct.unpack('>IIII', f.read(16))
                data = np.frombuffer(f.read(), dtype=np.uint8).reshape(num, rows, cols)
            # EMNIST images need to be transposed (they're column-major)
            data = np.transpose(data, (0, 2, 1))
            return data

        def download_and_parse_labels(filename):
            filepath = os.path.join(cache_dir, filename)
            if not os.path.exists(filepath):
                print(f"  Downloading {filename}...")
                urllib.request.urlretrieve(BASE_URL + filename, filepath)
            with gzip.open(filepath, 'rb') as f:
                magic, num = struct.unpack('>II', f.read(8))
                labels = np.frombuffer(f.read(), dtype=np.uint8)
            return labels

        print("[INFO] Downloading EMNIST Letters dataset...")
        x_train = download_and_parse_images(files["train_images"])
        y_train = download_and_parse_labels(files["train_labels"])
        x_test = download_and_parse_images(files["test_images"])
        y_test = download_and_parse_labels(files["test_labels"])

        # Labels are 1-26, shift to 0-25
        y_train = y_train - 1
        y_test = y_test - 1

        return x_train, y_train, x_test, y_test, 26
    except Exception as e2:
        print(f"[ERROR] Could not download EMNIST: {e2}")
        print("[INFO] Falling back to MNIST digits-only for testing...")
        # Fallback: just use MNIST (digits only) as proof of concept
        (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
        return x_train, y_train, x_test, y_test, 10


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

    # Train Letters model (A-Z)
    x_train, y_train, x_test, y_test, n_classes = load_emnist_letters()
    letters_acc = train_and_export(
        "Letters (A-Z)", x_train, y_train, x_test, y_test, n_classes, LETTERS_TFLITE
    )

    # Train Digits model (0-9)
    x_train, y_train, x_test, y_test, n_classes = load_emnist_digits()
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
