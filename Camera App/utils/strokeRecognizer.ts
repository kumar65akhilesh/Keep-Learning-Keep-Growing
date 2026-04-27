/**
 * Stroke-Based Handwriting Recognizer (v2 — Multi-Feature)
 *
 * Uses multiple features to compare user drawings against templates:
 *   1. Point-cloud shape distance (bi-directional avg min distance)
 *   2. Directional histogram (8-bin angular distribution per stroke)
 *   3. Zone occupancy (3×3 grid density)
 *   4. Aspect ratio similarity
 *   5. Stroke count penalty
 *   6. Start/end point matching
 *
 * Each feature produces a sub-score; the weighted sum determines the winner.
 */

import {
  STROKE_PATHS,
  sampleStroke,
  type StrokePoint,
  type CharacterStrokes,
} from './strokePaths';

/** A simple 2D point (pixel coords from the canvas) */
interface Point {
  x: number;
  y: number;
}

/** Recognition result for a single candidate */
export interface RecognitionCandidate {
  char: string;
  score: number; // lower = better match
}

/** Internal: extracted features for comparison */
interface ShapeFeatures {
  /** Resampled point-cloud in 0–1 space */
  points: StrokePoint[];
  /** 8-bin direction histogram (normalised to sum=1) */
  dirHist: number[];
  /** 5×5 zone occupancy (normalised to sum=1) */
  zoneHist: number[];
  /** Aspect ratio (width / height, 0–∞) */
  aspectRatio: number;
  /** Number of separate strokes */
  strokeCount: number;
  /** Start and end points of each stroke (normalised 0–1) */
  strokeEndpoints: { start: StrokePoint; end: StrokePoint }[];
  /** Vertical center of gravity (0 = top, 1 = bottom) */
  verticalCog: number;
  /** Horizontal center of gravity (0 = left, 1 = right) */
  horizontalCog: number;
}

// ─── Constants ────────────────────────────────────────────────────

const SAMPLES_PER_STROKE = 40;
const DIR_BINS = 8;
const ZONE_GRID = 5;

/** Feature weights (tuned for A–Z + 1–9 discrimination) */
const W_SHAPE = 0.22;
const W_DIRECTION = 0.20;
const W_ZONE = 0.20;
const W_ENDPOINTS = 0.10;
const W_ASPECT = 0.06;
const W_STROKE_COUNT = 0.07;
const W_COG = 0.15;  // center-of-gravity (distinguishes V/A, W/M, etc.)

// ─── Normalisation ────────────────────────────────────────────────

/**
 * Normalise pixel strokes into 0–1 using bounding box, preserving aspect ratio.
 * Returns { normStrokes, aspectRatio }.
 */
function normaliseStrokes(strokes: Point[][]): { norm: StrokePoint[][]; aspectRatio: number } {
  const all = strokes.flat();
  if (all.length === 0) return { norm: [], aspectRatio: 1 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of all) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const aspectRatio = rangeX / rangeY;

  // Uniform scale using max dimension, centered
  const maxRange = Math.max(rangeX, rangeY);
  const offsetX = (maxRange - rangeX) / 2;
  const offsetY = (maxRange - rangeY) / 2;

  const norm = strokes.map((stroke) =>
    stroke.map((p) => ({
      x: (p.x - minX + offsetX) / maxRange,
      y: (p.y - minY + offsetY) / maxRange,
    }))
  );

  return { norm, aspectRatio };
}

// ─── Resampling ───────────────────────────────────────────────────

function resamplePoints(points: StrokePoint[], n: number): StrokePoint[] {
  if (points.length < 2) return [...points];

  const cumLen: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    cumLen.push(cumLen[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const totalLen = cumLen[cumLen.length - 1];
  if (totalLen === 0) return [points[0]];

  const result: StrokePoint[] = [];
  for (let s = 0; s < n; s++) {
    const t = (s / (n - 1)) * totalLen;
    let seg = 0;
    for (let i = 1; i < cumLen.length; i++) {
      if (cumLen[i] >= t) { seg = i - 1; break; }
    }
    const segLen = cumLen[seg + 1] - cumLen[seg];
    const frac = segLen > 0 ? (t - cumLen[seg]) / segLen : 0;
    result.push({
      x: points[seg].x + (points[seg + 1].x - points[seg].x) * frac,
      y: points[seg].y + (points[seg + 1].y - points[seg].y) * frac,
    });
  }
  return result;
}

// ─── Feature extraction ──────────────────────────────────────────

/** Build an 8-bin direction histogram from sequential point pairs. */
function buildDirHistogram(points: StrokePoint[]): number[] {
  const bins = new Array(DIR_BINS).fill(0);
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-6) continue;
    // angle in [0, 2π)
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    const bin = Math.min(DIR_BINS - 1, Math.floor((angle / (2 * Math.PI)) * DIR_BINS));
    bins[bin] += len; // weight by segment length
  }
  // normalise
  const sum = bins.reduce((a, b) => a + b, 0);
  if (sum > 0) for (let i = 0; i < bins.length; i++) bins[i] /= sum;
  return bins;
}

/** Build a 3×3 zone occupancy histogram. */
function buildZoneHistogram(points: StrokePoint[]): number[] {
  const zones = new Array(ZONE_GRID * ZONE_GRID).fill(0);
  for (const p of points) {
    const col = Math.min(ZONE_GRID - 1, Math.floor(p.x * ZONE_GRID));
    const row = Math.min(ZONE_GRID - 1, Math.floor(p.y * ZONE_GRID));
    zones[row * ZONE_GRID + col]++;
  }
  const sum = zones.reduce((a: number, b: number) => a + b, 0);
  if (sum > 0) for (let i = 0; i < zones.length; i++) zones[i] /= sum;
  return zones;
}

/**
 * Extract all features from normalised strokes.
 */
function extractFeatures(normStrokes: StrokePoint[][], aspectRatio: number): ShapeFeatures {
  const allPoints: StrokePoint[] = [];
  const endpoints: { start: StrokePoint; end: StrokePoint }[] = [];

  for (const stroke of normStrokes) {
    const resampled = resamplePoints(stroke, SAMPLES_PER_STROKE);
    allPoints.push(...resampled);
    if (resampled.length > 0) {
      endpoints.push({
        start: resampled[0],
        end: resampled[resampled.length - 1],
      });
    }
  }

  // Compute center of gravity
  let sumX = 0, sumY = 0;
  for (const p of allPoints) {
    sumX += p.x;
    sumY += p.y;
  }
  const n = allPoints.length || 1;

  return {
    points: allPoints,
    dirHist: buildDirHistogram(allPoints),
    zoneHist: buildZoneHistogram(allPoints),
    aspectRatio,
    strokeCount: normStrokes.length,
    strokeEndpoints: endpoints,
    verticalCog: sumY / n,
    horizontalCog: sumX / n,
  };
}

// ─── Distance metrics ─────────────────────────────────────────────

/** Bi-directional average minimum point distance */
function shapeDistance(a: StrokePoint[], b: StrokePoint[]): number {
  if (a.length === 0 || b.length === 0) return 1;
  const forward = avgMinDist(a, b);
  const backward = avgMinDist(b, a);
  return (forward + backward) / 2;
}

function avgMinDist(from: StrokePoint[], to: StrokePoint[]): number {
  let total = 0;
  for (const fp of from) {
    let best = Infinity;
    for (const tp of to) {
      const d = (fp.x - tp.x) ** 2 + (fp.y - tp.y) ** 2;
      if (d < best) best = d;
    }
    total += Math.sqrt(best);
  }
  return total / from.length;
}

/** Histogram distance (Bhattacharyya-like: 1 − sum(sqrt(a_i * b_i))) */
function histDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.sqrt(a[i] * b[i]);
  }
  return 1 - sum; // 0 = identical, 1 = totally different
}

/** Aspect ratio difference (log scale so 2:1 vs 1:2 have equal penalty) */
function aspectDistance(a: number, b: number): number {
  return Math.abs(Math.log((a + 0.01) / (b + 0.01)));
}

/** Stroke count penalty: fractional difference */
function strokeCountDistance(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(a, b, 1);
}

/**
 * Compare start/end points of strokes. Match by order, penalise extras.
 * Uses greedy matching when stroke counts differ.
 */
function endpointDistance(
  a: { start: StrokePoint; end: StrokePoint }[],
  b: { start: StrokePoint; end: StrokePoint }[],
): number {
  const n = Math.max(a.length, b.length);
  if (n === 0) return 0;

  let total = 0;
  const matched = Math.min(a.length, b.length);

  for (let i = 0; i < matched; i++) {
    const ds = Math.sqrt((a[i].start.x - b[i].start.x) ** 2 + (a[i].start.y - b[i].start.y) ** 2);
    const de = Math.sqrt((a[i].end.x - b[i].end.x) ** 2 + (a[i].end.y - b[i].end.y) ** 2);
    total += (ds + de) / 2;
  }

  // Penalise unmatched strokes
  total += (n - matched) * 0.5;

  return total / n;
}

// ─── Template cache ───────────────────────────────────────────────

const templateFeatureCache = new Map<string, ShapeFeatures>();

function getTemplateFeatures(char: string, strokes: CharacterStrokes): ShapeFeatures {
  if (templateFeatureCache.has(char)) return templateFeatureCache.get(char)!;

  // Template strokes are already in 0–1 space
  const allPoints: StrokePoint[] = [];
  const endpoints: { start: StrokePoint; end: StrokePoint }[] = [];

  for (const stroke of strokes) {
    const sampled = sampleStroke(stroke, SAMPLES_PER_STROKE);
    allPoints.push(...sampled);
    if (sampled.length > 0) {
      endpoints.push({ start: sampled[0], end: sampled[sampled.length - 1] });
    }
  }

  // Compute template aspect ratio from its point spread
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of allPoints) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const templateAR = ((maxX - minX) || 0.5) / ((maxY - minY) || 0.5);

  // Compute center of gravity for template
  let sumX = 0, sumY = 0;
  for (const p of allPoints) {
    sumX += p.x;
    sumY += p.y;
  }
  const n = allPoints.length || 1;

  const features: ShapeFeatures = {
    points: allPoints,
    dirHist: buildDirHistogram(allPoints),
    zoneHist: buildZoneHistogram(allPoints),
    aspectRatio: templateAR,
    strokeCount: strokes.length,
    strokeEndpoints: endpoints,
    verticalCog: sumY / n,
    horizontalCog: sumX / n,
  };

  templateFeatureCache.set(char, features);
  return features;
}

// ─── Main Recognition ─────────────────────────────────────────────

/**
 * Recognise user strokes against known character templates.
 *
 * @param userStrokes  Array of strokes in pixel coordinates
 * @param candidates   Which characters to consider (e.g. A–Z or 1–9)
 * @returns Sorted array of candidates (best match first)
 */
export function recognizeStrokes(
  userStrokes: Point[][],
  candidates: string[],
): RecognitionCandidate[] {
  if (userStrokes.length === 0) return [];

  // Filter out tiny accidental strokes (< 3 points)
  const validStrokes = userStrokes.filter((s) => s.length >= 3);
  if (validStrokes.length === 0) return [];

  const { norm, aspectRatio } = normaliseStrokes(validStrokes);
  const userFeats = extractFeatures(norm, aspectRatio);

  if (userFeats.points.length === 0) return [];

  const results: RecognitionCandidate[] = [];

  for (const char of candidates) {
    const charUpper = char.toUpperCase();
    const templateStrokes = STROKE_PATHS[charUpper];
    if (!templateStrokes) continue;

    const tplFeats = getTemplateFeatures(charUpper, templateStrokes);

    // Compute sub-scores (all in ~0–1 range)
    const sShape = shapeDistance(userFeats.points, tplFeats.points);
    const sDir = histDistance(userFeats.dirHist, tplFeats.dirHist);
    const sZone = histDistance(userFeats.zoneHist, tplFeats.zoneHist);
    const sEndpoints = endpointDistance(userFeats.strokeEndpoints, tplFeats.strokeEndpoints);
    const sAspect = Math.min(1, aspectDistance(userFeats.aspectRatio, tplFeats.aspectRatio));
    const sStrokeCount = strokeCountDistance(userFeats.strokeCount, tplFeats.strokeCount);
    const sCog = Math.sqrt(
      (userFeats.verticalCog - tplFeats.verticalCog) ** 2 +
      (userFeats.horizontalCog - tplFeats.horizontalCog) ** 2,
    );

    const score =
      W_SHAPE * sShape +
      W_DIRECTION * sDir +
      W_ZONE * sZone +
      W_ENDPOINTS * sEndpoints +
      W_ASPECT * sAspect +
      W_STROKE_COUNT * sStrokeCount +
      W_COG * sCog;

    results.push({ char: charUpper, score });
  }

  results.sort((a, b) => a.score - b.score);

  // Debug: log top 3
  if (results.length >= 3) {
    console.log(
      `[RECOGNIZE] Top: ${results.slice(0, 3).map((r) => `${r.char}(${r.score.toFixed(3)})`).join(' > ')}`,
    );
  }

  return results;
}

/**
 * Get the single best-match character, or null if too uncertain.
 */
export function recognizeBestMatch(
  userStrokes: Point[][],
  candidates: string[],
  maxScore = 0.45,
): { char: string; confidence: number } | null {
  const results = recognizeStrokes(userStrokes, candidates);
  if (results.length === 0) return null;

  const best = results[0];
  if (best.score > maxScore) return null;

  const confidence = Math.max(0, Math.min(1, 1 - best.score / maxScore));
  return { char: best.char, confidence };
}
