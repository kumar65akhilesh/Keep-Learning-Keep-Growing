/**
 * OCR Service — Web stub.
 * ML Kit is not available on web. Returns empty results.
 */

import type { RecognizedCharacter, RecognitionMode, OcrResult } from '../types';
import { filterByMode } from '../utils/characterFilter';

export async function recognizeFromUri(
  imageUri: string,
  mode: RecognitionMode
): Promise<OcrResult> {
  return {
    characters: [],
    mode,
    timestamp: Date.now(),
    imageUri,
    rawText: '',
  };
}

export function recognizeFromBlocks(
  blocks: any[],
  mode: RecognitionMode,
  imageWidth: number,
  imageHeight: number
): RecognizedCharacter[] {
  return [];
}
