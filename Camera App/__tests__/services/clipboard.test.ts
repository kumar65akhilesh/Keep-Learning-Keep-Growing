/**
 * Unit tests for clipboard service.
 *
 * Mocks expo-clipboard to test copy/paste logic.
 */

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
  getStringAsync: jest.fn().mockResolvedValue('test clipboard content'),
}));

import * as Clipboard from 'expo-clipboard';
import { copyText, getClipboardText } from '../../services/clipboard';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('copyText', () => {
  it('should copy text to clipboard and return true', async () => {
    const result = await copyText('HELLO');
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('HELLO');
    expect(result).toBe(true);
  });

  it('should return false if clipboard operation fails', async () => {
    (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Clipboard error')
    );
    const result = await copyText('test');
    expect(result).toBe(false);
  });

  it('should handle empty string', async () => {
    const result = await copyText('');
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('');
    expect(result).toBe(true);
  });
});

describe('getClipboardText', () => {
  it('should return clipboard content', async () => {
    const text = await getClipboardText();
    expect(text).toBe('test clipboard content');
    expect(Clipboard.getStringAsync).toHaveBeenCalled();
  });

  it('should return empty string on error', async () => {
    (Clipboard.getStringAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Read error')
    );
    const text = await getClipboardText();
    expect(text).toBe('');
  });
});
