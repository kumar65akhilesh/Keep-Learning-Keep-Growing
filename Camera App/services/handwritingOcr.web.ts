/**
 * Handwriting OCR Service — Web stub
 *
 * Web platform does not support native handwriting OCR.
 * Returns empty results.
 */

import type { RecognitionMode, OcrResult } from '../types';

export async function recognizeHandwriting(
  imageUri: string,
  mode: RecognitionMode
): Promise<OcrResult> {
  console.warn('[HandwritingOCR] Not available on web');
  return {
    characters: [],
    mode,
    timestamp: Date.now(),
    imageUri,
    rawText: '',
  };
}
