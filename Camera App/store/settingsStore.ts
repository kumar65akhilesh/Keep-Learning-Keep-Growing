import { create } from 'zustand';
import type { AppSettings, RecognitionMode } from '../types';

interface SettingsState extends AppSettings {
  // Actions
  setSpeechRate: (rate: number) => void;
  setSpeechLanguage: (lang: string) => void;
  setSpellOutLetters: (spell: boolean) => void;
  setAutoSave: (auto: boolean) => void;
  setSoundEffects: (enabled: boolean) => void;
  setDefaultMode: (mode: RecognitionMode) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // Defaults
  speechRate: 0.8,
  speechLanguage: 'en-US',
  spellOutLetters: true,
  autoSave: false,
  soundEffects: true,
  defaultMode: 'read-abc',
  theme: 'light',

  // Actions
  setSpeechRate: (rate) => set({ speechRate: rate }),
  setSpeechLanguage: (lang) => set({ speechLanguage: lang }),
  setSpellOutLetters: (spell) => set({ spellOutLetters: spell }),
  setAutoSave: (auto) => set({ autoSave: auto }),
  setSoundEffects: (enabled) => set({ soundEffects: enabled }),
  setDefaultMode: (mode) => set({ defaultMode: mode }),
  setTheme: (theme) => set({ theme }),
}));
