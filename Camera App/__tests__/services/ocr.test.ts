/**
 * Unit tests for the OCR service.
 *
 * Mocks react-native-mlkit-ocr to test the recognition pipeline
 * and character filtering logic.
 */

jest.mock('react-native-mlkit-ocr', () => ({
  __esModule: true,
  default: {
    detectFromUri: jest.fn(),
  },
}));

import MlkitOcr from 'react-native-mlkit-ocr';
import { recognizeFromUri, recognizeFromBlocks } from '../../services/ocr';

beforeEach(() => {
  jest.clearAllMocks();
});

/** Helper to build mock ML Kit result blocks */
function makeMlkitBlocks(texts: string[]) {
  return texts.map((text, i) => ({
    text,
    frame: { left: 0, top: i * 50, width: 500, height: 50 },
    lines: [
      {
        text,
        elements: [
          {
            text,
            confidence: 0.95,
            frame: { left: 10, top: i * 50, width: text.length * 20, height: 40 },
          },
        ],
      },
    ],
  }));
}

describe('recognizeFromUri', () => {
  it('should recognize and filter letters in abc mode', async () => {
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue(
      makeMlkitBlocks(['A1B2C'])
    );

    const result = await recognizeFromUri('file:///test.jpg', 'abc');

    expect(result.mode).toBe('abc');
    expect(result.characters.map((c) => c.text)).toEqual(['A', 'B', 'C']);
    expect(result.imageUri).toBe('file:///test.jpg');
    expect(result.timestamp).toBeDefined();
  });

  it('should recognize and filter digits in 123 mode', async () => {
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue(
      makeMlkitBlocks(['A1B2C3'])
    );

    const result = await recognizeFromUri('file:///test.jpg', '123');

    expect(result.mode).toBe('123');
    expect(result.characters.map((c) => c.text)).toEqual(['1', '2', '3']);
  });

  it('should exclude 0 from 123 mode results', async () => {
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue(
      makeMlkitBlocks(['102030'])
    );

    const result = await recognizeFromUri('file:///test.jpg', '123');
    expect(result.characters.map((c) => c.text)).toEqual(['1', '2', '3']);
  });

  it('should return empty characters when nothing matches mode', async () => {
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue(
      makeMlkitBlocks(['123'])
    );

    const result = await recognizeFromUri('file:///test.jpg', 'abc');
    expect(result.characters).toEqual([]);
  });

  it('should handle empty ML Kit results', async () => {
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue([]);

    const result = await recognizeFromUri('file:///test.jpg', 'abc');
    expect(result.characters).toEqual([]);
    expect(result.rawText).toBe('');
  });

  it('should include raw text from all blocks', async () => {
    (MlkitOcr.detectFromUri as jest.Mock).mockResolvedValue(
      makeMlkitBlocks(['Hello', 'World'])
    );

    const result = await recognizeFromUri('file:///test.jpg', 'abc');
    expect(result.rawText).toBe('Hello World');
  });
});

describe('recognizeFromBlocks', () => {
  it('should extract and filter characters from blocks', () => {
    const blocks = makeMlkitBlocks(['AB3']);

    const chars = recognizeFromBlocks(blocks, 'abc', 500, 200);

    expect(chars.map((c) => c.text)).toEqual(['A', 'B']);
  });

  it('should calculate relative bounding boxes', () => {
    const blocks = [
      {
        text: 'A',
        frame: { left: 0, top: 0, width: 500, height: 50 },
        lines: [
          {
            text: 'A',
            elements: [
              {
                text: 'A',
                confidence: 0.99,
                frame: { left: 100, top: 50, width: 40, height: 30 },
              },
            ],
          },
        ],
      },
    ];

    const chars = recognizeFromBlocks(blocks, 'abc', 500, 200);

    expect(chars[0].boundingBox.x).toBe(100 / 500);
    expect(chars[0].boundingBox.y).toBe(50 / 200);
    expect(chars[0].boundingBox.width).toBe(40 / 500);
    expect(chars[0].boundingBox.height).toBe(30 / 200);
  });

  it('should handle empty blocks', () => {
    const chars = recognizeFromBlocks([], 'abc', 500, 200);
    expect(chars).toEqual([]);
  });
});
