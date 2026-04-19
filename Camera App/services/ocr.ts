/**
 * ML Kit OCR Service
 *
 * Wraps react-native-mlkit-ocr to provide character-level recognition.
 * Results are filtered by the active RecognitionMode (abc or 123).
 */

import MlkitOcr from 'react-native-mlkit-ocr';
import type { RecognizedCharacter, RecognitionMode, OcrResult } from '../types';
import { filterByMode } from '../utils/characterFilter';

/**
 * Recognize characters from an image URI using ML Kit.
 *
 * @param imageUri - Local file URI of the image to process
 * @param mode - Recognition mode to filter characters by
 * @returns OcrResult with filtered characters matching the mode
 */
export async function recognizeFromUri(
  imageUri: string,
  mode: RecognitionMode
): Promise<OcrResult> {
  console.log('[OCR] Starting recognition, URI:', imageUri, 'mode:', mode);

  const mlkitResult = await MlkitOcr.detectFromUri(imageUri);

  console.log('[OCR] ML Kit returned', mlkitResult?.length ?? 0, 'blocks');
  if (mlkitResult && mlkitResult.length > 0) {
    for (let i = 0; i < mlkitResult.length; i++) {
      const block = mlkitResult[i];
      console.log(`[OCR] Block ${i}: text="${block.text}", frame=`, JSON.stringify(block.frame), 'lines=', block.lines?.length ?? 0);
      if (block.lines) {
        for (const line of block.lines) {
          console.log(`[OCR]   Line: "${line.text}", elements=`, line.elements?.length ?? 0);
          if (line.elements) {
            for (const el of line.elements) {
              console.log(`[OCR]     Element: "${el.text}", frame=`, JSON.stringify(el.frame), 'confidence=', el.confidence);
            }
          }
        }
      }
    }
  } else {
    console.log('[OCR] ML Kit returned EMPTY result — no text detected in image');
  }

  // Extract individual characters from ML Kit's block → line → element hierarchy
  const allCharacters: RecognizedCharacter[] = [];

  for (const block of mlkitResult) {
    if (!block.lines) continue;
    for (const line of block.lines) {
      if (!line.elements) continue;
      for (const element of line.elements) {
        if (!element.text || !element.frame) continue;
        // Each element is typically a word; break into individual characters
        const chars = element.text.split('');
        const elementWidth = element.frame.width / Math.max(chars.length, 1);

        const blockWidth = block.frame?.width ?? 1;
        const blockLeft = block.frame?.left ?? 0;
        const blockHeight = block.frame?.height ?? 1;
        const blockTop = block.frame?.top ?? 0;

        for (let i = 0; i < chars.length; i++) {
          allCharacters.push({
            text: chars[i],
            confidence: element.confidence ?? 0.8,
            boundingBox: {
              x: (element.frame.left + i * elementWidth) / (blockWidth + blockLeft || 1),
              y: element.frame.top / (blockHeight + blockTop || 1),
              width: elementWidth / (blockWidth + blockLeft || 1),
              height: element.frame.height / (blockHeight + blockTop || 1),
            },
          });
        }
      }
    }
  }

  console.log('[OCR] Total characters extracted:', allCharacters.length, 'texts:', allCharacters.map(c => c.text).join(''));

  // Filter to only characters matching the active mode
  const filteredCharacters = filterByMode(allCharacters, mode);

  console.log('[OCR] After filtering for mode', mode, ':', filteredCharacters.length, 'characters remain:', filteredCharacters.map(c => c.text).join(''));

  // Build raw text from all detected blocks
  const rawText = mlkitResult.map((block) => block.text).join(' ');

  return {
    characters: filteredCharacters,
    mode,
    timestamp: Date.now(),
    imageUri,
    rawText,
  };
}

/**
 * Recognize characters from ML Kit result blocks (for frame processor usage).
 * This is called with pre-processed ML Kit results rather than a URI.
 *
 * @param blocks - Raw ML Kit text blocks from frame processor
 * @param mode - Active recognition mode
 * @param imageWidth - Width of the source image/frame
 * @param imageHeight - Height of the source image/frame
 * @returns Array of filtered RecognizedCharacters
 */
export function recognizeFromBlocks(
  blocks: Array<{
    text: string;
    frame: { left: number; top: number; width: number; height: number };
    lines: Array<{
      text: string;
      elements: Array<{
        text: string;
        confidence?: number;
        frame: { left: number; top: number; width: number; height: number };
      }>;
    }>;
  }>,
  mode: RecognitionMode,
  imageWidth: number,
  imageHeight: number
): RecognizedCharacter[] {
  const allCharacters: RecognizedCharacter[] = [];

  for (const block of blocks) {
    for (const line of block.lines) {
      for (const element of line.elements) {
        const chars = element.text.split('');
        const elementWidth = element.frame.width / Math.max(chars.length, 1);

        for (let i = 0; i < chars.length; i++) {
          allCharacters.push({
            text: chars[i],
            confidence: element.confidence ?? 0.8,
            boundingBox: {
              x: (element.frame.left + i * elementWidth) / imageWidth,
              y: element.frame.top / imageHeight,
              width: elementWidth / imageWidth,
              height: element.frame.height / imageHeight,
            },
          });
        }
      }
    }
  }

  return filterByMode(allCharacters, mode);
}
