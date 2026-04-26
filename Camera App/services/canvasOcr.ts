/**
 * Canvas OCR Service — Native
 *
 * Captures the handwriting canvas as an image using react-native-view-shot,
 * then runs it through ML Kit OCR (react-native-mlkit-ocr) for recognition.
 *
 * The canvas is rendered with dark strokes on a white background, making it
 * ideal for ML Kit's text recognizer which expects natural/printed text.
 */

import { captureRef } from 'react-native-view-shot';
import MlkitOcr from 'react-native-mlkit-ocr';
import type { RecognitionMode } from '../types';
import { filterByMode } from '../utils/characterFilter';

export interface HandwriteResult {
  char: string;
  confidence: number;
}

/**
 * Capture the canvas View as a high-contrast PNG and run ML Kit OCR on it.
 *
 * @param canvasRef - React ref to the canvas View
 * @param mode - Recognition mode (determines letter vs number filtering)
 * @returns The best matching character and confidence, or null if nothing recognized
 */
export async function recognizeCanvas(
  canvasRef: React.RefObject<any>,
  mode: RecognitionMode,
  _strokes?: { x: number; y: number }[][],
): Promise<HandwriteResult | null> {
  if (!canvasRef.current) {
    console.warn('[CANVAS-OCR] canvasRef is null');
    return null;
  }

  try {
    // 1. Capture the canvas as a temporary PNG file
    const uri = await captureRef(canvasRef, {
      format: 'png',
      quality: 1.0,
      result: 'tmpfile',
      // High resolution for better OCR accuracy
      width: 640,
      height: 640,
    });

    console.log('[CANVAS-OCR] Captured canvas image:', uri);

    // 2. Run ML Kit OCR on the captured image
    const mlkitResult = await MlkitOcr.detectFromUri(uri);

    console.log('[CANVAS-OCR] ML Kit returned', mlkitResult?.length ?? 0, 'blocks');

    if (!mlkitResult || mlkitResult.length === 0) {
      console.log('[CANVAS-OCR] No text detected in canvas image');
      return null;
    }

    // 3. Extract all detected characters
    const allChars: { text: string; confidence: number }[] = [];

    for (const block of mlkitResult) {
      console.log(`[CANVAS-OCR] Block: "${block.text}"`);
      if (!block.lines) continue;
      for (const line of block.lines) {
        if (!line.elements) continue;
        for (const element of line.elements) {
          if (!element.text) continue;
          for (const ch of element.text.split('')) {
            allChars.push({
              text: ch,
              confidence: (element as any).confidence ?? 0.8,
            });
          }
        }
      }
    }

    console.log('[CANVAS-OCR] Extracted characters:', allChars.map(c => c.text).join(''));

    // 4. Filter by mode (letters vs numbers)
    const filtered = allChars.filter((c) => {
      if (mode.endsWith('-abc')) return /^[A-Za-z]$/.test(c.text);
      if (mode.endsWith('-123')) return /^[1-9]$/.test(c.text);
      return true;
    });

    if (filtered.length === 0) {
      console.log('[CANVAS-OCR] No characters matched the mode filter');
      return null;
    }

    // 5. Return the first (most prominent) character
    const best = filtered[0];
    return {
      char: best.text.toUpperCase(),
      confidence: best.confidence,
    };
  } catch (error) {
    console.error('[CANVAS-OCR] Error:', error);
    return null;
  }
}
