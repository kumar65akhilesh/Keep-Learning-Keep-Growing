/**
 * Text-to-Speech Service
 *
 * Wraps expo-speech to read recognized characters aloud.
 * Uses a high pitch (1.5) to mimic a child-like voice.
 * Supports letter-by-letter spelling (for kids learning the alphabet).
 * Includes a cancellation mechanism so Stop actually stops mid-spell.
 */

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/** Phonetic names for letters to improve TTS clarity */
const LETTER_PRONUNCIATIONS: Record<string, string> = {
  A: 'the letter A', B: 'bee', C: 'see', D: 'dee', E: 'the letter E',
  F: 'eff', G: 'jee', H: 'aitch', I: 'the letter I', J: 'jay',
  K: 'kay', L: 'ell', M: 'em', N: 'en', O: 'the letter O',
  P: 'pee', Q: 'queue', R: 'the letter R', S: 'ess', T: 'tee',
  U: 'the letter U', V: 'vee', W: 'double you', X: 'ex',
  Y: 'the letter Y', Z: 'zee',
};

/** Child-like voice pitch (1.0 = normal, 1.5 = higher/child-like) */
const CHILD_PITCH = 1.5;

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  language?: string;
}

/** Internal cancellation flag — set to true by stopSpeaking() */
let cancelledFlag = false;

/** Cached child-friendly voice identifier (resolved once on web) */
let cachedVoice: string | undefined;

/**
 * Find a child-friendly voice on web.
 * Prefers female/child voices which sound more natural at high pitch.
 */
async function getChildVoice(): Promise<string | undefined> {
  if (Platform.OS !== 'web') return undefined;
  if (cachedVoice !== undefined) return cachedVoice;

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    // Prefer voices with "female", "girl", or "child" in the name
    const preferred = voices.find(
      (v) => /female|girl|child|zira|hazel|susan/i.test(v.identifier ?? '')
    );
    // Fall back to any English voice
    const english = voices.find(
      (v) => v.language?.startsWith('en')
    );
    cachedVoice = preferred?.identifier ?? english?.identifier ?? undefined;
  } catch {
    cachedVoice = undefined;
  }
  return cachedVoice;
}

/**
 * Speak a single character aloud with phonetic pronunciation.
 * Uses high pitch to sound child-like.
 */
export async function speakCharacter(
  character: string,
  options: SpeakOptions = {}
): Promise<void> {
  const { rate = 0.85, pitch = CHILD_PITCH, language = 'en-US' } = options;

  const upper = character.toUpperCase();
  const pronunciation = LETTER_PRONUNCIATIONS[upper] ?? character;
  const voice = await getChildVoice();

  return new Promise<void>((resolve) => {
    Speech.speak(pronunciation, {
      rate,
      pitch,
      language,
      ...(voice ? { voice } : {}),
      onDone: resolve,
      onStopped: resolve,
      onError: () => resolve(),
    });
  });
}

/**
 * Speak multiple characters one by one with a pause between each.
 * Respects the cancellation flag so stopSpeaking() breaks the loop.
 */
export async function spellOutCharacters(
  characters: string[],
  options: SpeakOptions = {}
): Promise<void> {
  cancelledFlag = false;
  for (const char of characters) {
    if (cancelledFlag) break;
    await speakCharacter(char, options);
    if (cancelledFlag) break;
    // Small pause between characters
    await delay(300);
  }
}

/**
 * Speak a full text string (reads it as a word/sentence, not spelled out).
 * Uses high pitch to sound child-like.
 */
export async function speakText(
  text: string,
  options: SpeakOptions = {}
): Promise<void> {
  cancelledFlag = false;
  const { rate = 0.85, pitch = CHILD_PITCH, language = 'en-US' } = options;
  const voice = await getChildVoice();

  return new Promise<void>((resolve) => {
    Speech.speak(text, {
      rate,
      pitch,
      language,
      ...(voice ? { voice } : {}),
      onDone: resolve,
      onStopped: resolve,
      onError: () => resolve(),
    });
  });
}

/**
 * Stop any currently playing speech and cancel any ongoing spell-out loop.
 */
export function stopSpeaking(): void {
  cancelledFlag = true;
  Speech.stop();
}

/**
 * Check if the TTS engine is currently speaking.
 */
export async function isSpeakingNow(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

/** Promise-based delay helper */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const id = setTimeout(resolve, ms);
    // Allow cancellation to resolve delay early
    const check = setInterval(() => {
      if (cancelledFlag) {
        clearTimeout(id);
        clearInterval(check);
        resolve();
      }
    }, 50);
    // Clean up the interval when timeout fires normally
    setTimeout(() => clearInterval(check), ms + 10);
  });
}
