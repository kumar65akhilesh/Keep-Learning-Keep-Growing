/**
 * Unit tests for Zustand stores.
 */

import { useOcrStore } from '../../store/ocrStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useHistoryStore } from '../../store/historyStore';
import type { OcrResult, ScanRecord, RecognizedCharacter } from '../../types';

/** Helper to create mock character */
function makeChar(text: string, confidence = 0.9): RecognizedCharacter {
  return {
    text,
    confidence,
    boundingBox: { x: 0, y: 0, width: 0.1, height: 0.1 },
  };
}

describe('useOcrStore', () => {
  beforeEach(() => {
    useOcrStore.setState({
      mode: 'abc',
      currentResult: null,
      liveCharacters: [],
      isProcessing: false,
      totalCharactersFound: 0,
    });
  });

  it('should initialize with default values', () => {
    const state = useOcrStore.getState();
    expect(state.mode).toBe('abc');
    expect(state.currentResult).toBeNull();
    expect(state.liveCharacters).toEqual([]);
    expect(state.isProcessing).toBe(false);
    expect(state.totalCharactersFound).toBe(0);
  });

  it('should set recognition mode', () => {
    useOcrStore.getState().setMode('123');
    expect(useOcrStore.getState().mode).toBe('123');
  });

  it('should set current result and increment total count', () => {
    const result: OcrResult = {
      characters: [makeChar('A'), makeChar('B')],
      mode: 'abc',
      timestamp: Date.now(),
    };

    useOcrStore.getState().setCurrentResult(result);

    const state = useOcrStore.getState();
    expect(state.currentResult).toBe(result);
    expect(state.totalCharactersFound).toBe(2);
  });

  it('should accumulate total characters found', () => {
    const result1: OcrResult = {
      characters: [makeChar('A')],
      mode: 'abc',
      timestamp: Date.now(),
    };
    const result2: OcrResult = {
      characters: [makeChar('B'), makeChar('C'), makeChar('D')],
      mode: 'abc',
      timestamp: Date.now(),
    };

    useOcrStore.getState().setCurrentResult(result1);
    useOcrStore.getState().setCurrentResult(result2);

    expect(useOcrStore.getState().totalCharactersFound).toBe(4);
  });

  it('should clear current result', () => {
    useOcrStore.getState().setCurrentResult({
      characters: [makeChar('A')],
      mode: 'abc',
      timestamp: Date.now(),
    });

    useOcrStore.getState().clearCurrentResult();

    const state = useOcrStore.getState();
    expect(state.currentResult).toBeNull();
    expect(state.liveCharacters).toEqual([]);
  });

  it('should set live characters', () => {
    const chars = [makeChar('X'), makeChar('Y')];
    useOcrStore.getState().setLiveCharacters(chars);
    expect(useOcrStore.getState().liveCharacters).toBe(chars);
  });

  it('should set processing state', () => {
    useOcrStore.getState().setIsProcessing(true);
    expect(useOcrStore.getState().isProcessing).toBe(true);
  });
});

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      speechRate: 0.8,
      speechLanguage: 'en-US',
      spellOutLetters: true,
      autoSave: false,
      soundEffects: true,
      defaultMode: 'abc',
      theme: 'light',
    });
  });

  it('should initialize with sensible defaults', () => {
    const state = useSettingsStore.getState();
    expect(state.speechRate).toBe(0.8);
    expect(state.spellOutLetters).toBe(true);
    expect(state.autoSave).toBe(false);
    expect(state.defaultMode).toBe('abc');
  });

  it('should update speech rate', () => {
    useSettingsStore.getState().setSpeechRate(1.5);
    expect(useSettingsStore.getState().speechRate).toBe(1.5);
  });

  it('should update spell-out preference', () => {
    useSettingsStore.getState().setSpellOutLetters(false);
    expect(useSettingsStore.getState().spellOutLetters).toBe(false);
  });

  it('should update default mode', () => {
    useSettingsStore.getState().setDefaultMode('123');
    expect(useSettingsStore.getState().defaultMode).toBe('123');
  });

  it('should update theme', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });
});

describe('useHistoryStore', () => {
  const mockScan: ScanRecord = {
    id: 1,
    recognizedText: 'ABC',
    characters: [makeChar('A'), makeChar('B'), makeChar('C')],
    mode: 'abc',
    imageUri: 'file:///test.jpg',
    confidence: 0.95,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    useHistoryStore.setState({
      scans: [],
      isLoading: false,
    });
  });

  it('should initialize empty', () => {
    const state = useHistoryStore.getState();
    expect(state.scans).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should add a scan at the beginning of the list', () => {
    useHistoryStore.getState().addScan(mockScan);
    expect(useHistoryStore.getState().scans).toEqual([mockScan]);

    const secondScan = { ...mockScan, id: 2, recognizedText: 'XYZ' };
    useHistoryStore.getState().addScan(secondScan);

    const scans = useHistoryStore.getState().scans;
    expect(scans[0]).toBe(secondScan); // newest first
    expect(scans[1]).toBe(mockScan);
  });

  it('should remove a scan by ID', () => {
    useHistoryStore.getState().addScan(mockScan);
    useHistoryStore.getState().addScan({ ...mockScan, id: 2 });

    useHistoryStore.getState().removeScan(1);

    const scans = useHistoryStore.getState().scans;
    expect(scans).toHaveLength(1);
    expect(scans[0].id).toBe(2);
  });

  it('should clear all scans', () => {
    useHistoryStore.getState().addScan(mockScan);
    useHistoryStore.getState().addScan({ ...mockScan, id: 2 });

    useHistoryStore.getState().clearAll();
    expect(useHistoryStore.getState().scans).toEqual([]);
  });

  it('should set loading state', () => {
    useHistoryStore.getState().setIsLoading(true);
    expect(useHistoryStore.getState().isLoading).toBe(true);
  });
});
