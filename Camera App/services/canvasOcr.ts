/**
 * Canvas OCR Service — Native (Hybrid)
 *
 * Uses a two-pass recognition strategy for maximum accuracy:
 *   1. Capture canvas as image → ML Kit OCR (best for clear/printed-style writing)
 *   2. Stroke-based template matching fallback (better for single isolated characters)
 *
 * If both return a result, ML Kit is preferred (unless its result doesn't match
 * the mode filter). If ML Kit fails, the stroke recognizer result is used.
 */

import { captureRef } from 'react-native-view-shot';
import MlkitOcr from 'react-native-mlkit-ocr';
import type { RecognitionMode } from '../types';
import { recognizeBestMatch } from '../utils/strokeRecognizer';

export interface HandwriteResult {
  char: string;
  confidence: number;
}

/**
 * Try ML Kit OCR on the captured canvas image.
 */
async function tryMlKit(
  canvasRef: React.RefObject<any>,
  mode: RecognitionMode,
): Promise<HandwriteResult | null> {
  try {
    const uri = await captureRef(canvasRef, {
      format: 'png',
      quality: 1.0,
      result: 'tmpfile',
      width: 800,
      height: 800,
    });

    console.log('[CANVAS-OCR] Captured canvas image:', uri);

    const mlkitResult = await MlkitOcr.detectFromUri(uri);
    console.log('[CANVAS-OCR] ML Kit returned', mlkitResult?.length ?? 0, 'blocks');

    if (!mlkitResult || mlkitResult.length === 0) {
      console.log('[CANVAS-OCR] ML Kit: no text detected');
      return null;
    }

    // Extract characters
    const allChars: { text: string; confidence: number }[] = [];
    for (const block of mlkitResult) {
      console.log(`[CANVAS-OCR] ML Kit block: "${block.text}"`);
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

    // Filter by mode
    const filtered = allChars.filter((c) => {
      if (mode.endsWith('-abc')) return /^[A-Za-z]$/.test(c.text);
      if (mode.endsWith('-123')) return /^[1-9]$/.test(c.text);
      return true;
    });

    if (filtered.length === 0) return null;

    return {
      char: filtered[0].text.toUpperCase(),
      confidence: filtered[0].confidence,
    };
  } catch (error) {
    console.warn('[CANVAS-OCR] ML Kit error:', error);
    return null;
  }
}

/**
 * Try stroke-based template matching.
 */
function tryStrokeRecognizer(
  strokes: { x: number; y: number }[][],
  mode: RecognitionMode,
): HandwriteResult | null {
  const candidates = mode.endsWith('-abc')
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    : '123456789'.split('');

  return recognizeBestMatch(strokes, candidates);
}

/**
 * Hybrid recognition: ML Kit first, stroke recognizer fallback.
 *
 * @param canvasRef - React ref to the canvas View
 * @param mode - Recognition mode (letter vs number filtering)
 * @param strokes - User's drawn strokes (for stroke-based fallback)
 * @returns Best matching character and confidence, or null
 */
export async function recognizeCanvas(
  canvasRef: React.RefObject<any>,
  mode: RecognitionMode,
  strokes?: { x: number; y: number }[][],
): Promise<HandwriteResult | null> {
  if (!canvasRef.current) {
    console.warn('[CANVAS-OCR] canvasRef is null');
    return null;
  }

  // Run both recognizers
  const mlkitResult = await tryMlKit(canvasRef, mode);
  const strokeResult = strokes && strokes.length > 0
    ? tryStrokeRecognizer(strokes, mode)
    : null;

  console.log(
    `[CANVAS-OCR] ML Kit: ${mlkitResult?.char ?? 'null'} | Stroke: ${strokeResult?.char ?? 'null'}`,
  );

  // Decision logic:
  // 1. Both agree → high confidence, use that character
  if (mlkitResult && strokeResult && mlkitResult.char === strokeResult.char) {
    console.log(`[CANVAS-OCR] Both agree: ${mlkitResult.char}`);
    return {
      char: mlkitResult.char,
      confidence: Math.max(mlkitResult.confidence, strokeResult.confidence),
    };
  }

  // 2. Only ML Kit returned a result → use it
  if (mlkitResult && !strokeResult) {
    console.log(`[CANVAS-OCR] Using ML Kit only: ${mlkitResult.char}`);
    return mlkitResult;
  }

  // 3. Only stroke recognizer returned a result → use it
  if (!mlkitResult && strokeResult) {
    console.log(`[CANVAS-OCR] Using stroke recognizer only: ${strokeResult.char}`);
    return strokeResult;
  }

  // 4. Both returned different results → prefer stroke recognizer for single characters
  //    (ML Kit is optimized for words/paragraphs; stroke recognizer is better for isolated chars)
  if (mlkitResult && strokeResult) {
    console.log(
      `[CANVAS-OCR] Disagreement — ML Kit: ${mlkitResult.char} vs Stroke: ${strokeResult.char}. Using stroke recognizer.`,
    );
    return strokeResult;
  }

  // 5. Neither recognized anything
  console.log('[CANVAS-OCR] Neither recognizer returned a result');
  return null;
}
