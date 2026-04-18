/**
 * Unit tests for TTS service.
 *
 * Mocks expo-speech to test speech logic without native dependencies.
 */

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn((text: string, options?: { onDone?: () => void }) => {
    // Simulate immediate completion
    options?.onDone?.();
  }),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

import * as Speech from 'expo-speech';
import { speakCharacter, spellOutCharacters, speakText, stopSpeaking, isSpeaking } from '../../services/tts';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('speakCharacter', () => {
  it('should speak a letter with phonetic pronunciation', async () => {
    await speakCharacter('A');

    expect(Speech.speak).toHaveBeenCalledWith(
      'ay',
      expect.objectContaining({
        rate: 0.8,
        language: 'en-US',
      })
    );
  });

  it('should handle lowercase letters', async () => {
    await speakCharacter('b');

    expect(Speech.speak).toHaveBeenCalledWith(
      'bee',
      expect.objectContaining({
        rate: 0.8,
      })
    );
  });

  it('should use custom rate and language', async () => {
    await speakCharacter('C', { rate: 1.5, language: 'en-GB' });

    expect(Speech.speak).toHaveBeenCalledWith(
      'see',
      expect.objectContaining({
        rate: 1.5,
        language: 'en-GB',
      })
    );
  });

  it('should fall back to raw character for unknown chars', async () => {
    await speakCharacter('5');

    expect(Speech.speak).toHaveBeenCalledWith(
      '5',
      expect.objectContaining({
        rate: 0.8,
      })
    );
  });
});

describe('spellOutCharacters', () => {
  it('should speak each character in sequence', async () => {
    jest.useFakeTimers();

    const promise = spellOutCharacters(['A', 'B', 'C']);

    // Fast-forward through delays
    for (let i = 0; i < 3; i++) {
      jest.advanceTimersByTime(300);
      await Promise.resolve(); // flush microtasks
    }

    await promise;

    expect(Speech.speak).toHaveBeenCalledTimes(3);
    expect(Speech.speak).toHaveBeenNthCalledWith(1, 'ay', expect.any(Object));
    expect(Speech.speak).toHaveBeenNthCalledWith(2, 'bee', expect.any(Object));
    expect(Speech.speak).toHaveBeenNthCalledWith(3, 'see', expect.any(Object));

    jest.useRealTimers();
  });
});

describe('speakText', () => {
  it('should speak full text as-is', async () => {
    await speakText('Hello');

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({
        rate: 0.8,
        language: 'en-US',
      })
    );
  });
});

describe('stopSpeaking', () => {
  it('should call Speech.stop', () => {
    stopSpeaking();
    expect(Speech.stop).toHaveBeenCalled();
  });
});

describe('isSpeaking', () => {
  it('should return the speaking state', async () => {
    const result = await isSpeaking();
    expect(result).toBe(false);
    expect(Speech.isSpeakingAsync).toHaveBeenCalled();
  });
});
