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
