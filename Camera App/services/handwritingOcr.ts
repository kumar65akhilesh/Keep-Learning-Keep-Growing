/**
 * Handwriting OCR Service — Native
 *
 * Uses platform-specific native modules for handwriting recognition:
 *   • Android: Google ML Kit Text Recognition v2 (on-device)
 *   • iOS: Apple Vision framework (VNRecognizeTextRequest)
 *
 * Both return character-level results with bounding boxes.
 */

import { NativeModules, Platform } from 'react-native';
import type { RecognizedCharacter, RecognitionMode, OcrResult } from '../types';
import { filterByMode } from '../utils/characterFilter';

const { HandwritingOcrModule } = NativeModules;

/**
 * Recognize handwritten characters from an image URI using native APIs.
 *
 * @param imageUri - Local file URI of the captured/preprocessed image
 * @param mode - Recognition mode (scan-handwrite-abc or scan-handwrite-abc-lower)
 * @returns OcrResult with characters filtered and cased per mode
 */
export async function recognizeHandwriting(
  imageUri: string,
  mode: RecognitionMode
): Promise<OcrResult> {
  console.log('[HandwritingOCR] Starting recognition, URI:', imageUri, 'mode:', mode);

  if (!HandwritingOcrModule) {
    console.warn('[HandwritingOCR] Native module not available');
    return {
      characters: [],
      mode,
      timestamp: Date.now(),
      imageUri,
      rawText: '',
    };
  }

  const jsonString: string = await HandwritingOcrModule.recognizeHandwriting(imageUri);
  const parsed = JSON.parse(jsonString);

  console.log('[HandwritingOCR] Raw result:', parsed.characters?.length ?? 0, 'characters, rawText:', JSON.stringify(parsed.rawText));

  const allCharacters: RecognizedCharacter[] = (parsed.characters ?? []).map(
    (c: { text: string; confidence: number; boundingBox: { x: number; y: number; width: number; height: number } }) => ({
      text: c.text,
      confidence: c.confidence,
      boundingBox: c.boundingBox,
    })
  );

  const filtered = filterByMode(allCharacters, mode);

  console.log('[HandwritingOCR] After filtering:', filtered.length, 'characters');

  return {
    characters: filtered,
    mode,
    timestamp: Date.now(),
    imageUri,
    rawText: parsed.rawText ?? '',
  };
}
