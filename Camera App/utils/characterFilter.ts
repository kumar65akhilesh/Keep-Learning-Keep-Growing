/**
 * Character filter utilities.
 *
 * Modes ending in '-abc' filter to A-Z.
 * Modes ending in '-123' filter to 1-9.
 * This dramatically reduces misclassification (no "O" vs "0" confusion).
 */

import type { RecognitionMode, RecognizedCharacter } from '../types';

/** Regex for letters A-Z (case-insensitive, single character) */
const LETTER_REGEX = /^[A-Za-z]$/;

/** Regex for digits 1-9 (single character, excludes 0) */
const DIGIT_REGEX = /^[1-9]$/;

/** Helper: does this mode work with letters? */
export function isLetterMode(mode: RecognitionMode): boolean {
  return mode.endsWith('-abc');
}

/** Helper: is this a reading (camera) mode? */
export function isReadMode(mode: RecognitionMode): boolean {
  return mode.startsWith('read-');
}

/** Helper: is this a tracing mode? */
export function isTraceMode(mode: RecognitionMode): boolean {
  return mode.startsWith('trace-');
}

/** Helper: is this a handwriting recognition mode? */
export function isHandwriteMode(mode: RecognitionMode): boolean {
  return mode.startsWith('handwrite-');
}

/**
 * Filter recognized characters to only those matching the active mode.
 *
 * @param characters - Raw ML Kit results (all detected characters)
 * @param mode - Active recognition mode
 * @returns Only the characters matching the selected set
 */
export function filterByMode(
  characters: RecognizedCharacter[],
  mode: RecognitionMode
): RecognizedCharacter[] {
  const letters = isLetterMode(mode);
  const regex = letters ? LETTER_REGEX : DIGIT_REGEX;

  return characters
    .filter((char) => regex.test(char.text))
    .map((char) => ({
      ...char,
      text: letters ? char.text.toUpperCase() : char.text,
    }));
}

/**
 * Get the valid character set for a given mode.
 */
export function getCharacterSet(mode: RecognitionMode): string[] {
  if (isLetterMode(mode)) {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  }
  return '123456789'.split('');
}

/**
 * Check if a single string is a valid character for the given mode.
 */
export function isValidCharacter(text: string, mode: RecognitionMode): boolean {
  const regex = isLetterMode(mode) ? LETTER_REGEX : DIGIT_REGEX;
  return regex.test(text);
}
