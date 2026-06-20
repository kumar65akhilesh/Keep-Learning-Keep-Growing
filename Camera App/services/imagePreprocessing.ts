/**
 * Image Preprocessing Service
 *
 * Crops, resizes, and enhances images before OCR processing,
 * improving accuracy especially for single characters.
 */

import * as ImageManipulator from 'expo-image-manipulator';

interface PreprocessOptions {
  /** Target width for resizing */
  targetWidth?: number;
  /** Whether to convert to grayscale (helps OCR accuracy) */
  grayscale?: boolean;
  /** Compression quality (0-1) */
  quality?: number;
}

/**
 * Preprocess an image for optimal OCR recognition.
 * Applies resize and optional grayscale conversion.
 *
 * @param uri - Local URI of the captured image
 * @param options - Preprocessing configuration
 * @returns URI of the preprocessed image
 */
export async function preprocessImage(
  uri: string,
  options: PreprocessOptions = {}
): Promise<string> {
  const {
    targetWidth = 1024,
    quality = 0.9,
  } = options;

  const actions: ImageManipulator.Action[] = [
    { resize: { width: targetWidth } },
  ];

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
}

/**
 * Center-crop an image to a fraction of its original size.
 * Useful when shooting from a distance — removes empty margins.
 *
 * @param uri   - Local URI of the image
 * @param ratio - Fraction of the image to keep (0.3 = center 30%, 1.0 = no crop)
 * @returns URI of the cropped image (or original URI if ratio ≥ 1)
 */
export async function centerCrop(
  uri: string,
  ratio: number,
  square: boolean = false,
): Promise<string> {
  if (ratio >= 1) return uri;
  const r = Math.max(0.1, Math.min(1, ratio));

  // Need image dimensions — do a no-op manipulate to get info
  const info = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const w = info.width;
  const h = info.height;

  let cropW: number, cropH: number;
  if (square) {
    // Square crop: use the shorter dimension × ratio
    const side = Math.round(Math.min(w, h) * r);
    cropW = side;
    cropH = side;
  } else {
    cropW = Math.round(w * r);
    cropH = Math.round(h * r);
  }
  const originX = Math.round((w - cropW) / 2);
  const originY = Math.round((h - cropH) / 2);

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: { originX, originY, width: cropW, height: cropH } }],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

/**
 * Crop a region from an image (for isolating a detected character).
 *
 * @param uri - Source image URI
 * @param region - Crop region in pixels
 * @returns URI of the cropped image
 */
export async function cropRegion(
  uri: string,
  region: { originX: number; originY: number; width: number; height: number }
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: region }],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
  );

  return result.uri;
}
