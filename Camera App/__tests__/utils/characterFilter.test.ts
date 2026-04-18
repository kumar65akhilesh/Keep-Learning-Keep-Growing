/**
 * Unit tests for character filter utilities.
 *
 * Tests the core filtering logic that constrains OCR results
 * to either letters (ABC mode) or digits (123 mode).
 */

import { filterByMode, getCharacterSet, isValidCharacter } from '../../utils/characterFilter';
import type { RecognizedCharacter } from '../../types';

/** Helper to create a mock RecognizedCharacter */
function makeChar(text: string, confidence = 0.9): RecognizedCharacter {
  return {
    text,
    confidence,
    boundingBox: { x: 0, y: 0, width: 0.1, height: 0.1 },
  };
}

describe('filterByMode', () => {
  const mixedChars: RecognizedCharacter[] = [
    makeChar('A'),
    makeChar('3'),
    makeChar('B'),
    makeChar('7'),
    makeChar('z'),
    makeChar('0'),
    makeChar('!'),
    makeChar(' '),
  ];

  it('should filter to only letters in abc mode', () => {
    const result = filterByMode(mixedChars, 'abc');
    expect(result.map((c) => c.text)).toEqual(['A', 'B', 'Z']);
  });

  it('should filter to only digits 1-9 in 123 mode', () => {
    const result = filterByMode(mixedChars, '123');
    expect(result.map((c) => c.text)).toEqual(['3', '7']);
  });

  it('should exclude 0 in 123 mode', () => {
    const chars = [makeChar('0'), makeChar('5')];
    const result = filterByMode(chars, '123');
    expect(result.map((c) => c.text)).toEqual(['5']);
  });

  it('should normalize letters to uppercase in abc mode', () => {
    const chars = [makeChar('a'), makeChar('b'), makeChar('Z')];
    const result = filterByMode(chars, 'abc');
    expect(result.map((c) => c.text)).toEqual(['A', 'B', 'Z']);
  });

  it('should return empty array when no characters match', () => {
    const chars = [makeChar('!'), makeChar('@'), makeChar(' ')];
    expect(filterByMode(chars, 'abc')).toEqual([]);
    expect(filterByMode(chars, '123')).toEqual([]);
  });

  it('should handle empty input', () => {
    expect(filterByMode([], 'abc')).toEqual([]);
    expect(filterByMode([], '123')).toEqual([]);
  });

  it('should preserve confidence and bounding box data', () => {
    const chars = [makeChar('A', 0.95)];
    const result = filterByMode(chars, 'abc');
    expect(result[0].confidence).toBe(0.95);
    expect(result[0].boundingBox).toEqual({ x: 0, y: 0, width: 0.1, height: 0.1 });
  });
});

describe('getCharacterSet', () => {
  it('should return A-Z for abc mode', () => {
    const set = getCharacterSet('abc');
    expect(set).toHaveLength(26);
    expect(set[0]).toBe('A');
    expect(set[25]).toBe('Z');
  });

  it('should return 1-9 for 123 mode', () => {
    const set = getCharacterSet('123');
    expect(set).toHaveLength(9);
    expect(set[0]).toBe('1');
    expect(set[8]).toBe('9');
    expect(set).not.toContain('0');
  });
});

describe('isValidCharacter', () => {
  it('should validate letters in abc mode', () => {
    expect(isValidCharacter('A', 'abc')).toBe(true);
    expect(isValidCharacter('z', 'abc')).toBe(true);
    expect(isValidCharacter('3', 'abc')).toBe(false);
    expect(isValidCharacter('!', 'abc')).toBe(false);
  });

  it('should validate digits in 123 mode', () => {
    expect(isValidCharacter('5', '123')).toBe(true);
    expect(isValidCharacter('9', '123')).toBe(true);
    expect(isValidCharacter('0', '123')).toBe(false);
    expect(isValidCharacter('A', '123')).toBe(false);
  });

  it('should reject multi-character strings', () => {
    expect(isValidCharacter('AB', 'abc')).toBe(false);
    expect(isValidCharacter('12', '123')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidCharacter('', 'abc')).toBe(false);
    expect(isValidCharacter('', '123')).toBe(false);
  });
});
