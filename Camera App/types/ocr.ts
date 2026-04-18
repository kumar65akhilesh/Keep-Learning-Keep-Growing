/**
 * Recognition mode — determines the activity and character set.
 * read-abc / read-123: Camera OCR to recognize letters/numbers.
 * trace-abc / trace-123: Guided tracing practice (draw over a faded guide).
 * handwrite-abc / handwrite-123: Freehand writing → app recognizes what was drawn.
 */
export type RecognitionMode =
  | 'read-abc'
  | 'trace-abc'
  | 'handwrite-abc'
  | 'read-123'
  | 'trace-123'
  | 'handwrite-123';

/**
 * A single recognized character with metadata.
 */
export interface RecognizedCharacter {
  /** The recognized character string (e.g., "A" or "7") */
  text: string;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Bounding box in the image (relative coordinates 0-1) */
  boundingBox: BoundingBox;
}

/**
 * Bounding box for a detected character.
 * All values are relative (0-1) to image dimensions.
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Result from an OCR recognition pass.
 */
export interface OcrResult {
  /** All recognized characters (filtered to the active mode) */
  characters: RecognizedCharacter[];
  /** The recognition mode that was active */
  mode: RecognitionMode;
  /** Timestamp of recognition */
  timestamp: number;
  /** URI of the source image (if captured) */
  imageUri?: string;
  /** Raw full text detected (before filtering) */
  rawText?: string;
}

/**
 * A saved scan record in history.
 */
export interface ScanRecord {
  id: number;
  /** Recognized characters joined as string */
  recognizedText: string;
  /** Individual character data (JSON-serialized) */
  characters: RecognizedCharacter[];
  /** Mode used: 'abc' or '123' */
  mode: RecognitionMode;
  /** URI to the saved image */
  imageUri: string;
  /** Average confidence across characters */
  confidence: number;
  /** ISO timestamp */
  createdAt: string;
}

/**
 * User-configurable settings.
 */
export interface AppSettings {
  /** TTS speaking speed (0.5 - 2.0) */
  speechRate: number;
  /** TTS language code (e.g., 'en-US') */
  speechLanguage: string;
  /** Whether to spell out characters one by one */
  spellOutLetters: boolean;
  /** Auto-save scans to history */
  autoSave: boolean;
  /** Play fun sound effects on recognition */
  soundEffects: boolean;
  /** Default recognition mode */
  defaultMode: RecognitionMode;
  /** Theme preference */
  theme: 'light' | 'dark';
}

/**
 * Camera state for the camera screen.
 */
export interface CameraState {
  /** Whether the camera is active */
  isActive: boolean;
  /** Current camera facing direction */
  facing: 'front' | 'back';
  /** Flash mode */
  flash: 'off' | 'on';
  /** Whether currently processing a frame */
  isProcessing: boolean;
}
