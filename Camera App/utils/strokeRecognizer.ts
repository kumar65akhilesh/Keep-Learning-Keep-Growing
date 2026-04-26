/**
 * Stroke-Based Handwriting Recognizer
 *
 * Compares a user's freehand strokes against the known stroke templates
 * defined in strokePaths.ts. Uses normalised point sampling and average
 * minimum-distance scoring to find the best matching character.
 *
 * Algorithm:
 * 1. Normalise user strokes into 0–1 coordinate space
 * 2. Flatten all user strokes into one point cloud
 * 3. For each candidate character, flatten its sampled guide into a point cloud
 * 4. Compute a bi-directional average-minimum-distance score
 * 5. Return the character with the lowest (best) distance score
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

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Normalise pixel-coordinate strokes into 0–1 space based on their
 * bounding box. Adds a small margin so strokes aren't edge-to-edge.
 */
function normaliseStrokes(strokes: Point[][]): StrokePoint[][] {
  // Flatten to find bounding box
  const all = strokes.flat();
  if (all.length === 0) return [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of all) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  // Keep aspect ratio by using the larger range, centered
  const maxRange = Math.max(rangeX, rangeY);
  const offsetX = (maxRange - rangeX) / 2;
  const offsetY = (maxRange - rangeY) / 2;

  return strokes.map((stroke) =>
    stroke.map((p) => ({
      x: (p.x - minX + offsetX) / maxRange,
      y: (p.y - minY + offsetY) / maxRange,
    }))
  );
}

/**
 * Re-sample a stroke (array of points) to a fixed number of evenly-spaced points.
 */
function resamplePoints(points: StrokePoint[], n: number): StrokePoint[] {
  if (points.length < 2) return [...points];

  // Compute cumulative arc-length
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

/**
 * Compute one-directional average minimum distance:
 * For each point in `from`, find the nearest point in `to`, then average.
 */
function avgMinDistance(from: StrokePoint[], to: StrokePoint[]): number {
  if (from.length === 0 || to.length === 0) return Infinity;
  let total = 0;
  for (const fp of from) {
    let minDist = Infinity;
    for (const tp of to) {
      const d = Math.sqrt((fp.x - tp.x) ** 2 + (fp.y - tp.y) ** 2);
      if (d < minDist) minDist = d;
    }
    total += minDist;
  }
  return total / from.length;
}

// ─── Template cache ───────────────────────────────────────────────

const SAMPLES_PER_STROKE = 30;
const templateCache = new Map<string, StrokePoint[]>();

function getTemplateSamples(char: string, strokes: CharacterStrokes): StrokePoint[] {
  if (templateCache.has(char)) return templateCache.get(char)!;
  const points: StrokePoint[] = [];
  for (const stroke of strokes) {
    points.push(...sampleStroke(stroke, SAMPLES_PER_STROKE));
  }
  templateCache.set(char, points);
  return points;
}

// ─── Main Recognition ─────────────────────────────────────────────

/**
 * Recognise the user's drawn strokes against known character templates.
 *
 * @param userStrokes  Array of strokes in pixel coordinates
 * @param candidates   Which characters to consider (e.g. A–Z or 1–9)
 * @returns Sorted array of candidates (best match first), or empty if input is empty
 */
export function recognizeStrokes(
  userStrokes: Point[][],
  candidates: string[],
): RecognitionCandidate[] {
  if (userStrokes.length === 0) return [];

  // 1. Normalise user strokes to 0–1
  const normStrokes = normaliseStrokes(userStrokes);

  // 2. Resample each normalised user stroke, then flatten into one point cloud
  const userPoints: StrokePoint[] = [];
  for (const stroke of normStrokes) {
    userPoints.push(...resamplePoints(stroke, SAMPLES_PER_STROKE));
  }

  if (userPoints.length === 0) return [];

  // 3. Score against each candidate character
  const results: RecognitionCandidate[] = [];

  for (const char of candidates) {
    const charUpper = char.toUpperCase();
    const templateStrokes = STROKE_PATHS[charUpper];
    if (!templateStrokes) continue;

    const templatePoints = getTemplateSamples(charUpper, templateStrokes);

    // Bi-directional distance (user→template + template→user) for robustness
    const d1 = avgMinDistance(userPoints, templatePoints);
    const d2 = avgMinDistance(templatePoints, userPoints);
    const score = (d1 + d2) / 2;

    results.push({ char: charUpper, score });
  }

  // Sort by score ascending (lower = better)
  results.sort((a, b) => a.score - b.score);

  return results;
}

/**
 * Convenience: get the single best-match character, or null if no match.
 * Also applies a maximum-score threshold to avoid random garbage matching.
 */
export function recognizeBestMatch(
  userStrokes: Point[][],
  candidates: string[],
  maxScore = 0.35,
): { char: string; confidence: number } | null {
  const results = recognizeStrokes(userStrokes, candidates);
  if (results.length === 0) return null;

  const best = results[0];
  if (best.score > maxScore) return null;

  // Convert score (0 = perfect, maxScore = worst acceptable) into confidence (0–1)
  const confidence = Math.max(0, Math.min(1, 1 - best.score / maxScore));
  return { char: best.char, confidence };
}
