/**
 * Handwriting OCR Service — Segment + EMNIST TFLite
 *
 * Pipeline (fully offline, no ML Kit / Vision dependency):
 *   1. Native module segments the camera photo into individual character
 *      regions using adaptive thresholding + connected-component labelling.
 *   2. Each region is returned as a 28×28 EMNIST-format Float32 grid
 *      (white-on-black, centred in a 20×20 area).
 *   3. This JS layer feeds each grid through the same EMNIST TFLite CNN
 *      used by the "Handwrite" on-screen mode (~85-90% accuracy on
 *      handwritten characters).
 *
 * Isolated from the other OCR tiles — no shared model singletons with
 * canvasOcr so the two features can evolve independently.
 */

import { NativeModules } from 'react-native';
import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';
import type { RecognizedCharacter, RecognitionMode, OcrResult } from '../types';
import { filterByMode, isLetterMode, isLowercaseMode } from '../utils/characterFilter';

const { HandwritingOcrModule } = NativeModules;

/**
 * Log to console AND persist to the native debug log file (DEBUG builds only).
 * Failures (e.g. no native module on web) are silently ignored.
 */
function scanLog(line: string) {
  console.log(line);
  try {
    HandwritingOcrModule?.appendLog?.(line)?.catch?.(() => {});
  } catch {
    /* noop */
  }
}

// ─── Verbose debug logging (set to true for deep debugging only) ──
// When false, suppresses 28×28 ASCII grids and full probability arrays
// that flood LogBox and trigger "Text strings must be rendered" warnings.
const VERBOSE_LOG = false;

// ─── Label maps ───────────────────────────────────────────────────

const LETTER_LABELS       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_LETTER_LABELS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const DIGIT_LABELS        = '0123456789'.split('');

// ─── Lazy model singletons (isolated from canvasOcr) ─────────────

let lettersModel:      TensorflowModel | null = null;
let lettersLowerModel: TensorflowModel | null = null;
let digitsModel:       TensorflowModel | null = null;
let lettersP:      Promise<TensorflowModel> | null = null;
let lettersLowerP: Promise<TensorflowModel> | null = null;
let digitsP:       Promise<TensorflowModel> | null = null;

async function resolveAssetUri(moduleId: number): Promise<string> {
  const [asset] = await Asset.loadAsync(moduleId);
  if (!asset.localUri) throw new Error('Failed to resolve TFLite asset to local URI');
  return asset.localUri;
}

function getLettersModel(): Promise<TensorflowModel> {
  if (lettersModel) return Promise.resolve(lettersModel);
  if (!lettersP) {
    console.log('[ScanOCR] Loading uppercase letters model…');
    lettersP = resolveAssetUri(require('../assets/emnist-letters.tflite') as number)
      .then((uri) => loadTensorflowModel({ url: uri }, []))
      .then((m) => { lettersModel = m; return m; })
      .catch((e) => { lettersP = null; throw e; });
  }
  return lettersP;
}

function getLettersLowerModel(): Promise<TensorflowModel> {
  if (lettersLowerModel) return Promise.resolve(lettersLowerModel);
  if (!lettersLowerP) {
    console.log('[ScanOCR] Loading lowercase letters model…');
    lettersLowerP = resolveAssetUri(require('../assets/emnist-letters-lower.tflite') as number)
      .then((uri) => loadTensorflowModel({ url: uri }, []))
      .then((m) => { lettersLowerModel = m; return m; })
      .catch((e) => { lettersLowerP = null; throw e; });
  }
  return lettersLowerP;
}

function getDigitsModel(): Promise<TensorflowModel> {
  if (digitsModel) return Promise.resolve(digitsModel);
  if (!digitsP) {
    console.log('[ScanOCR] Loading digits model…');
    digitsP = resolveAssetUri(require('../assets/emnist-digits.tflite') as number)
      .then((uri) => loadTensorflowModel({ url: uri }, []))
      .then((m) => { digitsModel = m; return m; })
      .catch((e) => { digitsP = null; throw e; });
  }
  return digitsP;
}

// ─── Main entry point ────────────────────────────────────────────

/**
 * Recognize handwritten characters from a camera photo.
 *
 * @param imageUri - Local file URI of the captured/preprocessed image
 * @param mode     - Recognition mode (scan-handwrite-abc or scan-handwrite-abc-lower)
 */
export async function recognizeHandwriting(
  imageUri: string,
  mode: RecognitionMode,
): Promise<OcrResult> {
  console.log('[ScanOCR] ── recognizeHandwriting ── URI:', imageUri, 'mode:', mode);

  if (!HandwritingOcrModule) {
    console.warn('[ScanOCR] Native module not available');
    return { characters: [], mode, timestamp: Date.now(), imageUri, rawText: '' };
  }

  // ── Step 1: Native segmentation ─────────────────────────────────
  const tSeg = Date.now();
  const jsonString: string = await HandwritingOcrModule.recognizeHandwriting(imageUri);
  const parsed = JSON.parse(jsonString);
  const crops = parsed.characters ?? [];
  console.log(`[ScanOCR] Segmentation returned ${crops.length} regions (took ${Date.now() - tSeg}ms)`);
  if (parsed.debugOverlayUri) {
    console.log(`[ScanOCR] 🔍 Debug overlay PNG: ${parsed.debugOverlayUri}`);
  }
  for (let i = 0; i < crops.length; i++) {
    const bb = crops[i].boundingBox;
    console.log(`[ScanOCR]   crop[${i}] bbox x=${bb.x.toFixed(3)} y=${bb.y.toFixed(3)} w=${bb.width.toFixed(3)} h=${bb.height.toFixed(3)}`);
  }

  if (crops.length === 0) {
    console.log('[ScanOCR] FINAL count=0 (no segments)');
    return { characters: [], mode, timestamp: Date.now(), imageUri, rawText: '' };
  }

  // ── Step 2: Load EMNIST model ───────────────────────────────────
  const isLetters  = isLetterMode(mode);
  const isLower    = isLowercaseMode(mode);
  const tModel = Date.now();
  const model      = isLower ? await getLettersLowerModel()
                   : isLetters ? await getLettersModel()
                   : await getDigitsModel();
  const labels     = isLower ? LOWER_LETTER_LABELS
                   : isLetters ? LETTER_LABELS
                   : DIGIT_LABELS;
  scanLog(`[ScanOCR] Model loaded: ${isLower ? 'lowercase letters' : isLetters ? 'uppercase letters' : 'digits'} (${labels.length} classes, took ${Date.now() - tModel}ms)`);

  // ── Step 3: Run EMNIST inference on each crop ───────────────────
  const recognized: RecognizedCharacter[] = [];
  const rawChars: string[] = [];

  for (let i = 0; i < crops.length; i++) {
    const crop = crops[i];
    const pixels = new Float32Array(crop.pixels as number[]);

    // ── Pixel stats for this crop (diagnose blank/saturated inputs) ──
    let nonZero = 0, pixSum = 0, pixMin = 1, pixMax = 0;
    for (let p = 0; p < pixels.length; p++) {
      const v = pixels[p];
      if (v > 0) { nonZero++; pixSum += v; }
      if (v < pixMin) pixMin = v;
      if (v > pixMax) pixMax = v;
    }
    const coverage = ((nonZero / 784) * 100).toFixed(1);
    const avgIntensity = nonZero > 0 ? (pixSum / nonZero).toFixed(3) : '0';
    scanLog(
      `[ScanOCR]   Crop[${i}] pixel stats: ${nonZero}/784 filled (${coverage}%), min=${pixMin.toFixed(3)} max=${pixMax.toFixed(3)} sum=${pixSum.toFixed(1)} avgNonZero=${avgIntensity}`
    );
    if (nonZero < 10) {
      scanLog(`[ScanOCR]   ⚠️ Crop[${i}] VERY FEW PIXELS — native segmentation may have failed`);
    } else if (nonZero > 700) {
      scanLog(`[ScanOCR]   ⚠️ Crop[${i}] VERY HIGH FILL — possible blob/noise`);
    }

    // ── 28×28 ASCII visualization (only when verbose logging enabled) ──
    if (VERBOSE_LOG) {
      let viz = `[ScanOCR]   Crop[${i}] 28x28 grid:\n`;
      for (let y = 0; y < 28; y++) {
        let row = '    ';
        for (let x = 0; x < 28; x++) {
          const v = pixels[y * 28 + x];
          row += v > 0.7 ? '#' : v > 0.3 ? '+' : v > 0.1 ? '.' : ' ';
        }
        viz += row + '\n';
      }
      scanLog(viz);
    }

    // Transpose row-major (native) → column-major (model expects column-major EMNIST layout)
    const modelInput = new Float32Array(784);
    for (let r = 0; r < 28; r++) {
      for (let c = 0; c < 28; c++) {
        modelInput[c * 28 + r] = pixels[r * 28 + c];
      }
    }

    const tInfer = Date.now();
    const buf = modelInput.buffer.slice(
      modelInput.byteOffset,
      modelInput.byteOffset + modelInput.byteLength,
    ) as ArrayBuffer;

    const outputs = model.runSync([buf]);
    const probs   = new Float32Array(outputs[0] as ArrayBuffer);
    scanLog(`[ScanOCR]   Crop[${i}] inference took ${Date.now() - tInfer}ms`);

    // Best prediction
    let bestIdx  = 0;
    let bestProb = probs[0];
    for (let j = 1; j < probs.length; j++) {
      if (probs[j] > bestProb) { bestProb = probs[j]; bestIdx = j; }
    }

    const predicted = labels[bestIdx];
    const finalChar = predicted;

    // Top-5 for logging + prob distribution stats
    const sorted = [...probs]
      .map((p, idx) => ({ p, c: labels[idx] }))
      .sort((a, b) => b.p - a.p);
    const top5 = sorted.slice(0, 5)
      .map((x) => `${x.c}(${(x.p * 100).toFixed(1)}%)`)
      .join(' ');
    let pMin = probs[0], pMax = probs[0], pSum = 0;
    for (const v of probs) { if (v < pMin) pMin = v; if (v > pMax) pMax = v; pSum += v; }
    const bb = crop.boundingBox;
    scanLog(
      `[ScanOCR]   Char[${i}] "${finalChar}" @ ${(bestProb * 100).toFixed(1)}% | bbox=(${bb.x.toFixed(2)},${bb.y.toFixed(2)},${bb.width.toFixed(2)},${bb.height.toFixed(2)}) | probs[min=${pMin.toExponential(2)} max=${pMax.toExponential(2)} sum=${pSum.toFixed(3)}] | top5: ${top5}`
    );

    // Full probability distribution for deep debugging
    if (VERBOSE_LOG && probs.length <= 26) {
      const allProbs = labels.map((l, idx) => `${l}:${(probs[idx] * 100).toFixed(1)}`).join(' ');
      scanLog(`[ScanOCR]   Crop[${i}] full probs: ${allProbs}`);
    }

    // Skip low-confidence noise detections
    if (bestProb < 0.25) {
      scanLog(`[ScanOCR]   \u21b3 SKIPPED (confidence ${(bestProb * 100).toFixed(1)}% < 25% threshold)`);
      continue;
    }

    rawChars.push(finalChar);
    recognized.push({
      text: finalChar,
      confidence: bestProb,
      boundingBox: crop.boundingBox,
    });
  }

  // ── Step 4: Filter by mode ──────────────────────────────────────
  const filtered = filterByMode(recognized, mode);
  const rawText = rawChars.join('');
  scanLog(
    `[ScanOCR] FINAL count=${filtered.length} (raw=${recognized.length}) text="${filtered.map((c) => c.text).join('')}" rawText="${rawText}"`
  );

  return {
    characters: filtered,
    mode,
    timestamp: Date.now(),
    imageUri,
    rawText,
  };
}
