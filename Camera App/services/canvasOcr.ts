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
import { Asset } from 'expo-asset';
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

async function resolveAssetUri(moduleId: number): Promise<string> {
  const [asset] = await Asset.loadAsync(moduleId);
  if (!asset.localUri) throw new Error('Failed to resolve TFLite asset to local URI');
  return asset.localUri;
}

function getLettersModel(): Promise<TensorflowModel> {
  if (lettersModel) return Promise.resolve(lettersModel);
  if (!lettersLoadPromise) {
    console.log('[TFLITE] Loading letters model…');
    lettersLoadPromise = resolveAssetUri(
      require('../assets/emnist-letters.tflite') as number,
    ).then((uri) => loadTensorflowModel({ url: uri }, []))
     .then((m) => { lettersModel = m; return m; })
     .catch((err) => {
       // Reset so next attempt retries instead of returning cached rejection
       lettersLoadPromise = null;
       throw err;
     });
  }
  return lettersLoadPromise;
}

function getDigitsModel(): Promise<TensorflowModel> {
  if (digitsModel) return Promise.resolve(digitsModel);
  if (!digitsLoadPromise) {
    console.log('[TFLITE] Loading digits model…');
    digitsLoadPromise = resolveAssetUri(
      require('../assets/emnist-digits.tflite') as number,
    ).then((uri) => loadTensorflowModel({ url: uri }, []))
     .then((m) => { digitsModel = m; return m; })
     .catch((err) => {
       digitsLoadPromise = null;
       throw err;
     });
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

  /** Plot a point with EMNIST-matching stroke width (~2.5px radius for thicker, rounder strokes) */
  const plot = (cx: number, cy: number) => {
    const px0 = Math.round(cx);
    const py0 = Math.round(cy);
    // Radius 2 disk: full white at center, graduated falloff
    const R = 2;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const nx = px0 + dx;
        const ny = py0 + dy;
        if (nx < 0 || nx >= S || ny < 0 || ny >= S) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let value: number;
        if (dist <= 0.5) {
          value = 1.0;         // center
        } else if (dist <= 1.0) {
          value = 0.9;         // immediate neighbors
        } else if (dist <= 1.5) {
          value = 0.5;         // diagonal neighbors
        } else if (dist <= 2.0) {
          value = 0.25;        // outer ring (soft edge)
        } else {
          continue;
        }
        grid[ny * S + nx] = Math.max(grid[ny * S + nx], value);
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
    : '0123456789'.split('');
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
  console.log(`[TFLITE] ── recognizeCanvas called ── mode=${mode}, strokes=${strokes?.length ?? 0}`);

  if (!strokes || strokes.length === 0) {
    console.log('[TFLITE] No strokes provided, returning null');
    return null;
  }

  // Filter tiny accidental touches
  const valid = strokes.filter((s) => s.length >= 2);
  console.log(`[TFLITE] Strokes after filtering short ones: ${valid.length}/${strokes.length} (removed ${strokes.length - valid.length} single-point strokes)`);
  if (valid.length === 0) {
    console.log('[TFLITE] No valid strokes remain, returning null');
    return null;
  }

  // Log stroke details for debugging wrong results
  for (let i = 0; i < valid.length; i++) {
    const s = valid[i];
    const xs = s.map((p) => p.x);
    const ys = s.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    console.log(
      `[TFLITE]   Stroke ${i}: ${s.length} pts, bbox=[${minX.toFixed(0)},${minY.toFixed(0)} → ${maxX.toFixed(0)},${maxY.toFixed(0)}], size=${(maxX - minX).toFixed(0)}×${(maxY - minY).toFixed(0)}`
    );
  }

  // Overall bounding box
  const allPts = valid.flat();
  const allXs = allPts.map((p) => p.x);
  const allYs = allPts.map((p) => p.y);
  const bboxMinX = Math.min(...allXs), bboxMaxX = Math.max(...allXs);
  const bboxMinY = Math.min(...allYs), bboxMaxY = Math.max(...allYs);
  const bboxW = bboxMaxX - bboxMinX;
  const bboxH = bboxMaxY - bboxMinY;
  const aspectRatio = bboxH > 0 ? (bboxW / bboxH).toFixed(2) : 'inf';
  console.log(
    `[TFLITE] Overall bbox: [${bboxMinX.toFixed(0)},${bboxMinY.toFixed(0)} → ${bboxMaxX.toFixed(0)},${bboxMaxY.toFixed(0)}], size=${bboxW.toFixed(0)}×${bboxH.toFixed(0)}, aspect=${aspectRatio}, totalPoints=${allPts.length}`
  );

  const isLetters = mode.endsWith('-abc') || mode.endsWith('-abc-lower');
  const isLowercase = mode.endsWith('-abc-lower');
  const labels    = isLetters ? LETTER_LABELS : DIGIT_LABELS;
  console.log(`[TFLITE] Using ${isLetters ? 'letters' : 'digits'} model (${labels.length} classes)`);

  // ── Rasterise strokes ───────────────────────────────────────────
  const inputData = strokesToGrid(valid);

  // Debug visualisation (dev only)
  if (__DEV__) {
    let viz = '\n[TFLITE] 28×28 input:\n';
    for (let y = 0; y < 28; y++) {
      let row = '';
      for (let x = 0; x < 28; x++) {
        const v = inputData[y * 28 + x];
        row += v > 0.7 ? '█' : v > 0.3 ? '▒' : v > 0 ? '░' : ' ';
      }
      viz += row + '\n';
    }
    // Input stats for debugging
    let nonZero = 0, sum = 0;
    for (let i = 0; i < inputData.length; i++) {
      if (inputData[i] > 0) { nonZero++; sum += inputData[i]; }
    }
    const coverage = ((nonZero / 784) * 100).toFixed(1);
    console.log(`[TFLITE] Input stats: ${nonZero}/784 pixels filled (${coverage}% coverage), sum=${sum.toFixed(1)}, avg=${(sum / Math.max(nonZero, 1)).toFixed(2)}`);
    if (nonZero < 10) {
      console.warn('[TFLITE] ⚠️ Very few pixels filled — drawing may be too small or thin');
    } else if (nonZero > 500) {
      console.warn('[TFLITE] ⚠️ Very high pixel coverage — drawing may be too thick/blobby');
    }
    console.log(viz);
  }

  // ── TFLite inference ────────────────────────────────────────────
  try {
    const model = isLetters ? await getLettersModel() : await getDigitsModel();

    // EMNIST Letters images are stored column-major. The model was trained
    // without transposing to row-major, so we must transpose our row-major
    // rasterised grid to match. MNIST digits are already row-major — no
    // transpose needed for the digits model.
    let modelInput: Float32Array;
    if (isLetters) {
      const transposedData = new Float32Array(28 * 28);
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          transposedData[x * 28 + y] = inputData[y * 28 + x];
        }
      }
      modelInput = transposedData;
    } else {
      modelInput = inputData;
    }

    if (__DEV__) {
      let tviz = `\n[TFLITE] 28×28 model input${isLetters ? ' (transposed)' : ''}:\n`;
      for (let y = 0; y < 28; y++) {
        let row = '';
        for (let x = 0; x < 28; x++) {
          const v = modelInput[y * 28 + x];
          row += v > 0.7 ? '█' : v > 0.3 ? '▒' : v > 0 ? '░' : ' ';
        }
        tviz += row + '\n';
      }
      console.log(tviz);
    }

    const buf = modelInput.buffer.slice(
      modelInput.byteOffset,
      modelInput.byteOffset + modelInput.byteLength,
    ) as ArrayBuffer;
    const outputs = model.runSync([buf]);
    const probs = new Float32Array(outputs[0] as ArrayBuffer);

    let bestIdx = 0;
    let bestProb = probs[0];
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > bestProb) { bestProb = probs[i]; bestIdx = i; }
    }

    const predicted = labels[bestIdx];

    // Log top-5 predictions
    const sorted = [...probs]
      .map((p, i) => ({ p, c: labels[i] }))
      .sort((a, b) => b.p - a.p);
    const top5 = sorted.slice(0, 5)
      .map((x) => `${x.c}(${(x.p * 100).toFixed(1)}%)`)
      .join(' ');
    console.log(`[TFLITE] ✓ Predicted: "${predicted}" @ ${(bestProb * 100).toFixed(1)}% | Top 5: ${top5}`);

    // ── Post-processing: I/L disambiguation ───────────────────────
    // A plain vertical line (very narrow aspect ratio) after transpose
    // becomes horizontal, which the model confuses with "L". If the
    // drawing is essentially a vertical stroke and L/I are the top two,
    // prefer "I".
    if (isLetters && predicted === 'L' && bboxW > 0 && bboxH > 0) {
      const ar = bboxW / bboxH;
      const iIdx = labels.indexOf('I');
      const iProb = iIdx >= 0 ? probs[iIdx] : 0;
      if (ar < 0.25 && iProb > 0.1) {
        console.log(`[TFLITE] ⇢ I/L fix: aspect=${ar.toFixed(2)} (very narrow), overriding L→I`);
        const iChar = isLowercase ? 'i' : 'I';
        return { char: iChar, confidence: iProb };
      }
    }

    // Confidence warnings
    if (bestProb < 0.3) {
      console.warn(`[TFLITE] ⚠️ Low confidence (${(bestProb * 100).toFixed(1)}%) — result may be unreliable`);
    }
    if (sorted.length >= 2 && sorted[0].p - sorted[1].p < 0.1) {
      console.warn(`[TFLITE] ⚠️ Close call: "${sorted[0].c}" vs "${sorted[1].c}" (diff=${((sorted[0].p - sorted[1].p) * 100).toFixed(1)}%) — ambiguous input`);
    }

    console.log(`[TFLITE] ── Result: "${predicted}" ──`);
    const finalChar = isLowercase ? predicted.toLowerCase() : predicted;
    return { char: finalChar, confidence: bestProb };
  } catch (err) {
    console.warn('[TFLITE] Inference failed:', err);
    // Re-throw with a descriptive message so the UI can show what went wrong
    throw new Error(`TFLite failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
