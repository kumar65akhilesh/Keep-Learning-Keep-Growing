import { create } from 'zustand';
import type { RecognitionMode, OcrResult, RecognizedCharacter } from '../types';

interface OcrState {
  /** Current recognition mode */
  mode: RecognitionMode;
  /** Latest OCR result */
  currentResult: OcrResult | null;
  /** Characters found in real-time preview */
  liveCharacters: RecognizedCharacter[];
  /** Whether the OCR engine is currently processing */
  isProcessing: boolean;
  /** Total characters ever found (gamification) */
  totalCharactersFound: number;

  // Actions
  setMode: (mode: RecognitionMode) => void;
  setCurrentResult: (result: OcrResult) => void;
  setLiveCharacters: (chars: RecognizedCharacter[]) => void;
  setIsProcessing: (processing: boolean) => void;
  incrementTotalFound: (count: number) => void;
  clearCurrentResult: () => void;
}

export const useOcrStore = create<OcrState>((set) => ({
  mode: 'read-abc',
  currentResult: null,
  liveCharacters: [],
  isProcessing: false,
  totalCharactersFound: 0,

  setMode: (mode) => set({ mode }),

  setCurrentResult: (result) =>
    set((state) => ({
      currentResult: result,
      totalCharactersFound:
        state.totalCharactersFound + result.characters.length,
    })),

  setLiveCharacters: (chars) => set({ liveCharacters: chars }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  incrementTotalFound: (count) =>
    set((state) => ({
      totalCharactersFound: state.totalCharactersFound + count,
    })),

  clearCurrentResult: () =>
    set({ currentResult: null, liveCharacters: [] }),
}));
