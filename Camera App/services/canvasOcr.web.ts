/**
 * Canvas OCR Service — Web stub.
 *
 * ML Kit is not available on web, so this falls back to the
 * stroke-based template recognizer.
 */

import type { RecognitionMode } from '../types';
import { recognizeBestMatch } from '../utils/strokeRecognizer';

export interface HandwriteResult {
  char: string;
  confidence: number;
}

/**
 * Web fallback: uses stroke-based template matching instead of ML Kit OCR.
 *
 * @param _canvasRef - Unused on web
 * @param mode - Recognition mode (determines letter vs number filtering)
 * @param strokes - The user's drawn strokes (pixel coordinates)
 * @returns The best matching character and confidence, or null
 */
export async function recognizeCanvas(
  _canvasRef: React.RefObject<any>,
  mode: RecognitionMode,
  strokes?: { x: number; y: number }[][],
): Promise<HandwriteResult | null> {
  if (!strokes || strokes.length === 0) return null;

  const candidates = mode.endsWith('-abc')
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    : '123456789'.split('');

  const result = recognizeBestMatch(strokes, candidates);
  return result;
}
