/**
 * Clipboard Service
 *
 * Wraps expo-clipboard for copying recognized text.
 */

import * as Clipboard from 'expo-clipboard';

/**
 * Copy recognized text to the system clipboard.
 *
 * @param text - Text to copy
 * @returns true if successful
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read text from the system clipboard.
 */
export async function getClipboardText(): Promise<string> {
  try {
    return await Clipboard.getStringAsync();
  } catch {
    return '';
  }
}
