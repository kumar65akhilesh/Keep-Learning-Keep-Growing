export { recognizeFromUri, recognizeFromBlocks } from './ocr';
export { speakCharacter, spellOutCharacters, speakText, stopSpeaking, isSpeaking } from './tts';
export { copyText, getClipboardText } from './clipboard';
export { preprocessImage, cropRegion } from './imagePreprocessing';
export {
  saveScan,
  getScans,
  searchScans,
  deleteScan,
  deleteAllScans,
  getScanCount,
  getTotalCharactersFound,
} from './history';
