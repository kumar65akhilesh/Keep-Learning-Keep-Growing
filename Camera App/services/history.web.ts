/**
 * History Service — Web implementation (in-memory storage).
 * SQLite is not available on web, so we store scans in memory.
 */

import type { ScanRecord, RecognizedCharacter, RecognitionMode } from '../types';

let inMemoryScans: ScanRecord[] = [];
let nextId = 1;

export async function saveScan(params: {
  recognizedText: string;
  characters: RecognizedCharacter[];
  mode: RecognitionMode;
  imageUri: string;
  confidence: number;
}): Promise<ScanRecord> {
  const scan: ScanRecord = {
    id: nextId++,
    recognizedText: params.recognizedText,
    characters: params.characters,
    mode: params.mode,
    imageUri: params.imageUri,
    confidence: params.confidence,
    createdAt: new Date().toISOString(),
  };
  inMemoryScans.unshift(scan);
  return scan;
}

export async function getScans(limit = 50, offset = 0): Promise<ScanRecord[]> {
  return inMemoryScans.slice(offset, offset + limit);
}

export async function searchScans(query: string): Promise<ScanRecord[]> {
  const lowerQuery = query.toLowerCase();
  return inMemoryScans.filter((s) =>
    s.recognizedText.toLowerCase().includes(lowerQuery)
  );
}

export async function deleteScan(id: number): Promise<void> {
  inMemoryScans = inMemoryScans.filter((s) => s.id !== id);
}

export async function deleteAllScans(): Promise<void> {
  inMemoryScans = [];
}

export async function getScanCount(): Promise<number> {
  return inMemoryScans.length;
}

export async function getTotalCharactersFound(): Promise<number> {
  return inMemoryScans.reduce((sum, s) => sum + s.recognizedText.length, 0);
}
