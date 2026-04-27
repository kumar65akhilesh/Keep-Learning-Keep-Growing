/**
 * Canvas OCR Service — Native (TFLite + EMNIST)
 *
 * Uses on-device TFLite CNN models trained on the EMNIST dataset for
 * handwriting recognition. Two models:
 *   • emnist-letters.tflite — A–Z (26 classes, label 0 = A … 25 = Z)
 *   • emnist-digits.tflite  — 0–9 (10 classes, label 0 = 0 … 9 = 9)
 *
 * Stroke coordinates are rasterised directly onto a 28×28 grayscale grid
 * (white-on-black, matching EMNIST format) so no image capture / decode is
 * needed.
 *
 * Falls back to the stroke-based template recogniser if TFLite fails to load.
 */

import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';
import type { RecognitionMode } from '../types';
import { recognizeBestMatch } from '../utils/strokeRecognizer';

// ─── Public types ─────────────────────────────────────────────────

export interface HandwriteResult {
  char: string;
  confidence: number;
}

// ─── Label maps ───────────────────────────────────────────────────

const LETTER_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGIT_LABELS  = '0123456789'.split('');

// ─── Lazy model singletons ───────────────────────────────────────

let lettersModel: TensorflowModel | null = null;
let digitsModel: TensorflowModel | null = null;
let lettersLoadPromise: Promise<TensorflowModel> | null = null;
let digitsLoadPromise: Promise<TensorflowModel> | null = null;

function getLettersModel(): Promise<TensorflowModel> {
  if (lettersModel) return Promise.resolve(lettersModel);
  if (!lettersLoadPromise) {
    lettersLoadPromise = loadTensorflowModel(
      require('../assets/emnist-letters.tflite'),
      [],
    ).then((m) => { lettersModel = m; return m; });
    console.log('[TFLITE] Loading letters model…');
  }
  return lettersLoadPromise;
}

function getDigitsModel(): Promise<TensorflowModel> {
  if (digitsModel) return Promise.resolve(digitsModel);
  if (!digitsLoadPromise) {
    digitsLoadPromise = loadTensorflowModel(
      require('../assets/emnist-digits.tflite'),
      [],
    ).then((m) => { digitsModel = m; return m; });
    console.log('[TFLITE] Loading digits model…');
  }
  return digitsLoadPromise;
}

// ─── Stroke → 28×28 grid ─────────────────────────────────────────

/**
 * Rasterise user strokes onto a 28×28 Float32 grid (white-on-black).
 *
 * The drawing is fitted into a 20×20 centred area with 4 px padding on
 * each side, matching the EMNIST normalisation convention.
 */
function strokesToGrid(strokes: { x: number; y: number }[][]): Float32Array {
  const S = 28;
  const grid = new Float32Array(S * S); // all zeros = black

  // Bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const stroke of strokes) {
    for (const p of stroke) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (minX >= maxX || minY >= maxY) return grid;

  // Scale into 20×20 area centred in 28×28
  const maxRange = Math.max(maxX - minX, maxY - minY);
  const scale   = 20 / maxRange;
  const offX    = (S - (maxX - minX) * scale) / 2;
  const offY    = (S - (maxY - minY) * scale) / 2;

  /** Set pixel with Gaussian-ish anti-aliased blob */
  const plot = (cx: number, cy: number) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = Math.round(cx + dx);
        const py = Math.round(cy + dy);
        if (px < 0 || px >= S || py < 0 || py >= S) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const val  = dist <= 0.5 ? 1.0 : dist <= 1.0 ? 0.7 : 0.3;
        const idx  = py * S + px;
        grid[idx]  = Math.max(grid[idx], val);
      }
    }
  };

  for (const stroke of strokes) {
    for (let i = 1; i < stroke.length; i++) {
      const x0 = (stroke[i - 1].x - minX) * scale + offX;
      const y0 = (stroke[i - 1].y - minY) * scale + offY;
      const x1 = (stroke[i].x - minX) * scale + offX;
      const y1 = (stroke[i].y - minY) * scale + offY;

      const dx    = x1 - x0;
      const dy    = y1 - y0;
      const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);

      for (let s = 0; s <= steps; s++) {
        plot(x0 + (dx / steps) * s, y0 + (dy / steps) * s);
      }
    }
    // Also plot single-point strokes (e.g. dots)
    if (stroke.length === 1) {
      const px = (stroke[0].x - minX) * scale + offX;
      const py = (stroke[0].y - minY) * scale + offY;
      plot(px, py);
    }
  }

  return grid;
}

// ─── Stroke-recogniser fallback ───────────────────────────────────

function strokeFallback(
  strokes: { x: number; y: number }[][],
  mode: RecognitionMode,
): HandwriteResult | null {
  const candidates = mode.endsWith('-abc')
    ? LETTER_LABELS
    : '123456789'.split('');
  return recognizeBestMatch(strokes, candidates);
}

// ─── Main entry point ─────────────────────────────────────────────

/**
 * Recognise a handwritten character using TFLite EMNIST inference.
 *
 * @param _canvasRef – kept for API compat (not used — we rasterise strokes directly)
 * @param mode       – determines letters vs digits model
 * @param strokes    – user's drawn strokes in canvas pixel coords
 */
export async function recognizeCanvas(
  _canvasRef: React.RefObject<any>,
  mode: RecognitionMode,
  strokes?: { x: number; y: number }[][],
): Promise<HandwriteResult | null> {
  if (!strokes || strokes.length === 0) return null;

  // Filter tiny accidental touches
  const valid = strokes.filter((s) => s.length >= 2);
  if (valid.length === 0) return null;

  const isLetters = mode.endsWith('-abc');
  const labels    = isLetters ? LETTER_LABELS : DIGIT_LABELS;

  // ── Rasterise strokes ───────────────────────────────────────────
  const rawGrid = strokesToGrid(valid);

  // EMNIST images are stored column-major (transposed). Even after the
  // training script's np.transpose, the model learned on images whose
  // x/y axes are swapped relative to natural screen drawing. Transposing
  // the 28×28 grid (swap rows ↔ cols) aligns our input with the model.
  const inputData = new Float32Array(28 * 28);
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      inputData[x * 28 + y] = rawGrid[y * 28 + x]; // transpose
    }
  }

  // Debug visualisation (dev only)
  if (__DEV__) {
    let viz = '\n[TFLITE] 28×28 drawn:\n';
    for (let y = 0; y < 28; y++) {
      let row = '';
      for (let x = 0; x < 28; x++) {
        const v = rawGrid[y * 28 + x];
        row += v > 0.7 ? '█' : v > 0.3 ? '▒' : v > 0 ? '░' : ' ';
      }
      viz += row + '\n';
    }
    viz += '\n[TFLITE] 28×28 transposed (model input):\n';
    for (let y = 0; y < 28; y++) {
      let row = '';
      for (let x = 0; x < 28; x++) {
        const v = inputData[y * 28 + x];
        row += v > 0.7 ? '█' : v > 0.3 ? '▒' : v > 0 ? '░' : ' ';
      }
      viz += row + '\n';
    }
    console.log(viz);
  }

  // ── TFLite inference ────────────────────────────────────────────
  try {
    const model = isLetters ? await getLettersModel() : await getDigitsModel();

    // Feed raw Float32Array buffer into the model
    const buf     = inputData.buffer.slice(
      inputData.byteOffset,
      inputData.byteOffset + inputData.byteLength,
    ) as ArrayBuffer;
    const outputs = model.runSync([buf]);
    const probs   = new Float32Array(outputs[0] as ArrayBuffer);

    // Find best prediction
    let bestIdx  = 0;
    let bestProb = probs[0];
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > bestProb) { bestProb = probs[i]; bestIdx = i; }
    }

    const predicted = labels[bestIdx];

    // Log top-3
    const top3 = [...probs]
      .map((p, i) => ({ p, c: labels[i] }))
      .sort((a, b) => b.p - a.p)
      .slice(0, 3)
      .map((x) => `${x.c}(${(x.p * 100).toFixed(0)}%)`)
      .join(' ');
    console.log(`[TFLITE] ✓ ${predicted} ${(bestProb * 100).toFixed(1)}% | Top 3: ${top3}`);

    // In digit mode skip "0" (app uses 1-9)
    if (!isLetters && predicted === '0') {
      const sorted = [...probs].map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
      for (const s of sorted) {
        if (DIGIT_LABELS[s.i] !== '0') {
          return { char: DIGIT_LABELS[s.i], confidence: s.p };
        }
      }
      return null;
    }

    return { char: predicted, confidence: bestProb };
  } catch (err) {
    console.warn('[TFLITE] Inference failed, falling back to stroke recogniser:', err);
    return strokeFallback(valid, mode);
  }
}
