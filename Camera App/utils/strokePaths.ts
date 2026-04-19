/**
 * Stroke Paths — Guided stroke-by-stroke definitions for A–Z and 1–9.
 *
 * Each character is an ordered array of strokes. Each stroke is an array of
 * waypoints in a **normalised 0–1 coordinate system** (0,0 = top-left,
 * 1,1 = bottom-right of the drawing canvas).
 *
 * When the kid traces, the app highlights one stroke at a time. Once a stroke
 * is traced close enough, it darkens/fills and the next stroke lights up.
 *
 * ─────────────────────────────────────────────
 * Grid reference (approx character anatomy):
 *
 *   0.0  ┬──────────────────┬  1.0
 *        │ (cap / ascender) │
 *   0.14 │                  │
 *        │  (upper body)    │
 *   0.5  │ ─── midline ───  │
 *        │  (lower body)    │
 *   0.86 │                  │
 *        │  (baseline)      │
 *   1.0  ┴──────────────────┴
 *
 *   x: 0.0 = left edge, 0.5 = centre, 1.0 = right edge
 * ─────────────────────────────────────────────
 */

/** A single waypoint normalised 0–1 */
export interface StrokePoint {
  x: number;
  y: number;
}

/** One stroke = ordered list of waypoints */
export type StrokePath = StrokePoint[];

/** All strokes for a character, drawn in order */
export type CharacterStrokes = StrokePath[];

// ────────────── LETTERS A–Z ──────────────

const A: CharacterStrokes = [
  // stroke 1: left diagonal  ╱  (bottom-left → top-centre)
  [{ x: 0.15, y: 0.95 }, { x: 0.5, y: 0.05 }],
  // stroke 2: right diagonal  ╲  (top-centre → bottom-right)
  [{ x: 0.5, y: 0.05 }, { x: 0.85, y: 0.95 }],
  // stroke 3: horizontal crossbar  ─
  [{ x: 0.28, y: 0.55 }, { x: 0.72, y: 0.55 }],
];

const B: CharacterStrokes = [
  // stroke 1: vertical spine  │
  [{ x: 0.2, y: 0.05 }, { x: 0.2, y: 0.95 }],
  // stroke 2: top bump  )
  [{ x: 0.2, y: 0.05 }, { x: 0.65, y: 0.12 }, { x: 0.7, y: 0.28 }, { x: 0.65, y: 0.47 }, { x: 0.2, y: 0.5 }],
  // stroke 3: bottom bump  )
  [{ x: 0.2, y: 0.5 }, { x: 0.7, y: 0.57 }, { x: 0.75, y: 0.72 }, { x: 0.7, y: 0.88 }, { x: 0.2, y: 0.95 }],
];

const C: CharacterStrokes = [
  // stroke 1: open curve
  [{ x: 0.8, y: 0.15 }, { x: 0.55, y: 0.05 }, { x: 0.25, y: 0.15 }, { x: 0.15, y: 0.35 },
   { x: 0.15, y: 0.65 }, { x: 0.25, y: 0.85 }, { x: 0.55, y: 0.95 }, { x: 0.8, y: 0.85 }],
];

const D: CharacterStrokes = [
  // stroke 1: vertical spine  │
  [{ x: 0.2, y: 0.05 }, { x: 0.2, y: 0.95 }],
  // stroke 2: bump curve  )
  [{ x: 0.2, y: 0.05 }, { x: 0.6, y: 0.1 }, { x: 0.8, y: 0.3 }, { x: 0.8, y: 0.7 },
   { x: 0.6, y: 0.9 }, { x: 0.2, y: 0.95 }],
];

const E: CharacterStrokes = [
  // stroke 1: vertical spine  │
  [{ x: 0.2, y: 0.05 }, { x: 0.2, y: 0.95 }],
  // stroke 2: top bar  ─
  [{ x: 0.2, y: 0.05 }, { x: 0.8, y: 0.05 }],
  // stroke 3: middle bar  ─
  [{ x: 0.2, y: 0.5 }, { x: 0.7, y: 0.5 }],
  // stroke 4: bottom bar  ─
  [{ x: 0.2, y: 0.95 }, { x: 0.8, y: 0.95 }],
];

const F: CharacterStrokes = [
  // stroke 1: vertical spine  │
  [{ x: 0.2, y: 0.05 }, { x: 0.2, y: 0.95 }],
  // stroke 2: top bar  ─
  [{ x: 0.2, y: 0.05 }, { x: 0.8, y: 0.05 }],
  // stroke 3: middle bar  ─
  [{ x: 0.2, y: 0.5 }, { x: 0.7, y: 0.5 }],
];

const G: CharacterStrokes = [
  // stroke 1: C-curve
  [{ x: 0.8, y: 0.15 }, { x: 0.55, y: 0.05 }, { x: 0.25, y: 0.15 }, { x: 0.15, y: 0.35 },
   { x: 0.15, y: 0.65 }, { x: 0.25, y: 0.85 }, { x: 0.55, y: 0.95 }, { x: 0.8, y: 0.85 }, { x: 0.8, y: 0.55 }],
  // stroke 2: horizontal inward bar
  [{ x: 0.8, y: 0.55 }, { x: 0.55, y: 0.55 }],
];

const H: CharacterStrokes = [
  // stroke 1: left vertical  │
  [{ x: 0.2, y: 0.05 }, { x: 0.2, y: 0.95 }],
  // stroke 2: right vertical  │
  [{ x: 0.8, y: 0.05 }, { x: 0.8, y: 0.95 }],
  // stroke 3: crossbar  ─
  [{ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }],
];

const I_letter: CharacterStrokes = [
  // stroke 1: vertical  │
  [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 }],
  // stroke 2: top serif  ─
  [{ x: 0.3, y: 0.05 }, { x: 0.7, y: 0.05 }],
  // stroke 3: bottom serif  ─
  [{ x: 0.3, y: 0.95 }, { x: 0.7, y: 0.95 }],
];

const J: CharacterStrokes = [
  // stroke 1: vertical (right side) curving to bottom hook
  [{ x: 0.65, y: 0.05 }, { x: 0.65, y: 0.75 }, { x: 0.55, y: 0.92 }, { x: 0.35, y: 0.95 }, { x: 0.2, y: 0.82 }],
];

const K: CharacterStrokes = [
  // stroke 1: vertical spine  │
  [{ x: 0.2, y: 0.05 }, { x: 0.2, y: 0.95 }],
  // stroke 2: upper diagonal  ╲ (top-right → middle)
  [{ x: 0.8, y: 0.05 }, { x: 0.2, y: 0.5 }],
  // stroke 3: lower diagonal  ╱ (middle → bottom-right)
  [{ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.95 }],
];

const L: CharacterStrokes = [
  // stroke 1: vertical  │
  [{ x: 0.2, y: 0.05 }, { x: 0.2, y: 0.95 }],
  // stroke 2: bottom bar  ─
  [{ x: 0.2, y: 0.95 }, { x: 0.8, y: 0.95 }],
];

const M: CharacterStrokes = [
  // stroke 1: left vertical  │
  [{ x: 0.1, y: 0.95 }, { x: 0.1, y: 0.05 }],
  // stroke 2: left diagonal  ╲
  [{ x: 0.1, y: 0.05 }, { x: 0.5, y: 0.55 }],
  // stroke 3: right diagonal  ╱
  [{ x: 0.5, y: 0.55 }, { x: 0.9, y: 0.05 }],
  // stroke 4: right vertical  │
  [{ x: 0.9, y: 0.05 }, { x: 0.9, y: 0.95 }],
];

const N: CharacterStrokes = [
  // stroke 1: left vertical  │
  [{ x: 0.2, y: 0.95 }, { x: 0.2, y: 0.05 }],
  // stroke 2: diagonal  ╲
  [{ x: 0.2, y: 0.05 }, { x: 0.8, y: 0.95 }],
  // stroke 3: right vertical  │
  [{ x: 0.8, y: 0.95 }, { x: 0.8, y: 0.05 }],
];

const O: CharacterStrokes = [
  // stroke 1: full oval (starting top-centre, clockwise)
  [{ x: 0.5, y: 0.05 }, { x: 0.75, y: 0.12 }, { x: 0.85, y: 0.35 }, { x: 0.85, y: 0.65 },
   { x: 0.75, y: 0.88 }, { x: 0.5, y: 0.95 }, { x: 0.25, y: 0.88 }, { x: 0.15, y: 0.65 },
   { x: 0.15, y: 0.35 }, { x: 0.25, y: 0.12 }, { x: 0.5, y: 0.05 }],
];

const P: CharacterStrokes = [
  // stroke 1: vertical spine  │
  [{ x: 0.2, y: 0.05 }, { x: 0.2, y: 0.95 }],
  // stroke 2: top bump  )
  [{ x: 0.2, y: 0.05 }, { x: 0.65, y: 0.1 }, { x: 0.78, y: 0.25 }, { x: 0.65, y: 0.45 }, { x: 0.2, y: 0.5 }],
];

const Q: CharacterStrokes = [
  // stroke 1: oval (same as O)
  [{ x: 0.5, y: 0.05 }, { x: 0.75, y: 0.12 }, { x: 0.85, y: 0.35 }, { x: 0.85, y: 0.65 },
   { x: 0.75, y: 0.88 }, { x: 0.5, y: 0.95 }, { x: 0.25, y: 0.88 }, { x: 0.15, y: 0.65 },
   { x: 0.15, y: 0.35 }, { x: 0.25, y: 0.12 }, { x: 0.5, y: 0.05 }],
  // stroke 2: tail  ╲
  [{ x: 0.6, y: 0.75 }, { x: 0.85, y: 0.98 }],
];

const R: CharacterStrokes = [
  // stroke 1: vertical spine  │
  [{ x: 0.2, y: 0.05 }, { x: 0.2, y: 0.95 }],
  // stroke 2: bump  )
  [{ x: 0.2, y: 0.05 }, { x: 0.65, y: 0.1 }, { x: 0.78, y: 0.25 }, { x: 0.65, y: 0.45 }, { x: 0.2, y: 0.5 }],
  // stroke 3: leg  ╲
  [{ x: 0.45, y: 0.5 }, { x: 0.8, y: 0.95 }],
];

const S: CharacterStrokes = [
  // stroke 1: S-curve
  [{ x: 0.75, y: 0.15 }, { x: 0.55, y: 0.05 }, { x: 0.3, y: 0.1 }, { x: 0.2, y: 0.25 },
   { x: 0.3, y: 0.42 }, { x: 0.5, y: 0.5 }, { x: 0.7, y: 0.58 }, { x: 0.8, y: 0.75 },
   { x: 0.7, y: 0.9 }, { x: 0.45, y: 0.95 }, { x: 0.25, y: 0.85 }],
];

const T: CharacterStrokes = [
  // stroke 1: top bar  ─
  [{ x: 0.1, y: 0.05 }, { x: 0.9, y: 0.05 }],
  // stroke 2: vertical  │
  [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 }],
];

const U: CharacterStrokes = [
  // stroke 1: U-shape (down, curve, up)
  [{ x: 0.2, y: 0.05 }, { x: 0.2, y: 0.72 }, { x: 0.3, y: 0.9 }, { x: 0.5, y: 0.95 },
   { x: 0.7, y: 0.9 }, { x: 0.8, y: 0.72 }, { x: 0.8, y: 0.05 }],
];

const V: CharacterStrokes = [
  // stroke 1: left diagonal  ╲
  [{ x: 0.15, y: 0.05 }, { x: 0.5, y: 0.95 }],
  // stroke 2: right diagonal  ╱
  [{ x: 0.5, y: 0.95 }, { x: 0.85, y: 0.05 }],
];

const W: CharacterStrokes = [
  // stroke 1:  ╲
  [{ x: 0.05, y: 0.05 }, { x: 0.25, y: 0.95 }],
  // stroke 2:  ╱
  [{ x: 0.25, y: 0.95 }, { x: 0.5, y: 0.4 }],
  // stroke 3:  ╲
  [{ x: 0.5, y: 0.4 }, { x: 0.75, y: 0.95 }],
  // stroke 4:  ╱
  [{ x: 0.75, y: 0.95 }, { x: 0.95, y: 0.05 }],
];

const X: CharacterStrokes = [
  // stroke 1: ╲
  [{ x: 0.15, y: 0.05 }, { x: 0.85, y: 0.95 }],
  // stroke 2: ╱
  [{ x: 0.85, y: 0.05 }, { x: 0.15, y: 0.95 }],
];

const Y: CharacterStrokes = [
  // stroke 1: left arm  ╲ to centre
  [{ x: 0.15, y: 0.05 }, { x: 0.5, y: 0.5 }],
  // stroke 2: right arm  ╱ to centre
  [{ x: 0.85, y: 0.05 }, { x: 0.5, y: 0.5 }],
  // stroke 3: tail  │
  [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.95 }],
];

const Z: CharacterStrokes = [
  // stroke 1: top bar  ─
  [{ x: 0.15, y: 0.05 }, { x: 0.85, y: 0.05 }],
  // stroke 2: diagonal  ╲
  [{ x: 0.85, y: 0.05 }, { x: 0.15, y: 0.95 }],
  // stroke 3: bottom bar  ─
  [{ x: 0.15, y: 0.95 }, { x: 0.85, y: 0.95 }],
];

// ────────────── NUMBERS 1–9 ──────────────

const N1: CharacterStrokes = [
  // stroke 1: small serif  ╱
  [{ x: 0.3, y: 0.2 }, { x: 0.5, y: 0.05 }],
  // stroke 2: vertical  │
  [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 }],
  // stroke 3: bottom bar  ─
  [{ x: 0.3, y: 0.95 }, { x: 0.7, y: 0.95 }],
];

const N2: CharacterStrokes = [
  // stroke 1: top curve + diagonal + base
  [{ x: 0.2, y: 0.18 }, { x: 0.3, y: 0.08 }, { x: 0.55, y: 0.05 }, { x: 0.75, y: 0.12 },
   { x: 0.8, y: 0.28 }, { x: 0.7, y: 0.42 }, { x: 0.2, y: 0.95 }],
  // stroke 2: bottom bar  ─
  [{ x: 0.2, y: 0.95 }, { x: 0.85, y: 0.95 }],
];

const N3: CharacterStrokes = [
  // stroke 1: top half curve
  [{ x: 0.2, y: 0.12 }, { x: 0.4, y: 0.05 }, { x: 0.65, y: 0.08 }, { x: 0.75, y: 0.22 },
   { x: 0.65, y: 0.42 }, { x: 0.45, y: 0.48 }],
  // stroke 2: bottom half curve
  [{ x: 0.45, y: 0.48 }, { x: 0.68, y: 0.55 }, { x: 0.8, y: 0.72 },
   { x: 0.68, y: 0.9 }, { x: 0.45, y: 0.95 }, { x: 0.2, y: 0.88 }],
];

const N4: CharacterStrokes = [
  // stroke 1: down-angled arm
  [{ x: 0.65, y: 0.05 }, { x: 0.15, y: 0.6 }],
  // stroke 2: horizontal bar  ─
  [{ x: 0.15, y: 0.6 }, { x: 0.85, y: 0.6 }],
  // stroke 3: right vertical  │
  [{ x: 0.65, y: 0.05 }, { x: 0.65, y: 0.95 }],
];

const N5: CharacterStrokes = [
  // stroke 1: top bar  ─ (right to left)
  [{ x: 0.75, y: 0.05 }, { x: 0.25, y: 0.05 }],
  // stroke 2: vertical drop  │
  [{ x: 0.25, y: 0.05 }, { x: 0.25, y: 0.45 }],
  // stroke 3: bottom curve
  [{ x: 0.25, y: 0.45 }, { x: 0.55, y: 0.4 }, { x: 0.78, y: 0.55 }, { x: 0.78, y: 0.75 },
   { x: 0.65, y: 0.92 }, { x: 0.4, y: 0.95 }, { x: 0.2, y: 0.85 }],
];

const N6: CharacterStrokes = [
  // stroke 1: top curve down
  [{ x: 0.7, y: 0.12 }, { x: 0.5, y: 0.05 }, { x: 0.28, y: 0.15 }, { x: 0.18, y: 0.4 },
   { x: 0.18, y: 0.65 }, { x: 0.28, y: 0.88 }, { x: 0.5, y: 0.95 }, { x: 0.72, y: 0.88 },
   { x: 0.8, y: 0.7 }, { x: 0.72, y: 0.52 }, { x: 0.5, y: 0.45 }, { x: 0.25, y: 0.52 }],
];

const N7: CharacterStrokes = [
  // stroke 1: top bar  ─
  [{ x: 0.15, y: 0.05 }, { x: 0.85, y: 0.05 }],
  // stroke 2: diagonal  ╲
  [{ x: 0.85, y: 0.05 }, { x: 0.35, y: 0.95 }],
];

const N8: CharacterStrokes = [
  // stroke 1: top loop (start center-top, clockwise)
  [{ x: 0.5, y: 0.48 }, { x: 0.3, y: 0.4 }, { x: 0.22, y: 0.25 }, { x: 0.3, y: 0.1 },
   { x: 0.5, y: 0.05 }, { x: 0.7, y: 0.1 }, { x: 0.78, y: 0.25 }, { x: 0.7, y: 0.4 }, { x: 0.5, y: 0.48 }],
  // stroke 2: bottom loop (continue clockwise)
  [{ x: 0.5, y: 0.48 }, { x: 0.72, y: 0.58 }, { x: 0.82, y: 0.72 }, { x: 0.72, y: 0.88 },
   { x: 0.5, y: 0.95 }, { x: 0.28, y: 0.88 }, { x: 0.18, y: 0.72 }, { x: 0.28, y: 0.58 }, { x: 0.5, y: 0.48 }],
];

const N9: CharacterStrokes = [
  // stroke 1: top circle
  [{ x: 0.75, y: 0.48 }, { x: 0.5, y: 0.55 }, { x: 0.28, y: 0.48 }, { x: 0.2, y: 0.3 },
   { x: 0.28, y: 0.12 }, { x: 0.5, y: 0.05 }, { x: 0.72, y: 0.12 }, { x: 0.8, y: 0.3 }, { x: 0.75, y: 0.48 }],
  // stroke 2: tail down
  [{ x: 0.8, y: 0.4 }, { x: 0.78, y: 0.65 }, { x: 0.6, y: 0.9 }, { x: 0.35, y: 0.95 }],
];

// ────────────── MASTER LOOKUP ──────────────

export const STROKE_PATHS: Record<string, CharacterStrokes> = {
  A, B, C, D, E, F, G, H, I: I_letter, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z,
  '1': N1, '2': N2, '3': N3, '4': N4, '5': N5, '6': N6, '7': N7, '8': N8, '9': N9,
};

/**
 * Return the stroke definitions for a character, or null if unknown.
 */
export function getStrokes(char: string): CharacterStrokes | null {
  return STROKE_PATHS[char.toUpperCase()] ?? null;
}

/**
 * Sample evenly-spaced points along a multi-waypoint stroke path.
 * Used to render smooth guide lines and to evaluate proximity.
 */
export function sampleStroke(stroke: StrokePath, numSamples = 40): StrokePoint[] {
  if (stroke.length < 2) return [...stroke];

  // Compute cumulative segment lengths
  const lengths: number[] = [0];
  for (let i = 1; i < stroke.length; i++) {
    const dx = stroke[i].x - stroke[i - 1].x;
    const dy = stroke[i].y - stroke[i - 1].y;
    lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const totalLen = lengths[lengths.length - 1];
  if (totalLen === 0) return [stroke[0]];

  const points: StrokePoint[] = [];
  for (let s = 0; s < numSamples; s++) {
    const t = (s / (numSamples - 1)) * totalLen;
    // Find segment
    let seg = 0;
    for (let i = 1; i < lengths.length; i++) {
      if (lengths[i] >= t) { seg = i - 1; break; }
    }
    const segLen = lengths[seg + 1] - lengths[seg];
    const frac = segLen > 0 ? (t - lengths[seg]) / segLen : 0;
    points.push({
      x: stroke[seg].x + (stroke[seg + 1].x - stroke[seg].x) * frac,
      y: stroke[seg].y + (stroke[seg + 1].y - stroke[seg].y) * frac,
    });
  }
  return points;
}
