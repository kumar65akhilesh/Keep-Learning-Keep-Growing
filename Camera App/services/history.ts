/**
 * History Service — Native implementation (SQLite).
 *
 * Manages scan history using expo-sqlite.
 * Web uses history.web.ts instead (Metro resolves .web.ts automatically).
 */

import * as SQLite from 'expo-sqlite';
import type { ScanRecord, RecognizedCharacter, RecognitionMode } from '../types';

const DB_NAME = 'letterlens.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or initialize the database connection.
 */
async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recognized_text TEXT NOT NULL,
        characters TEXT NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('abc', '123')),
        image_uri TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_scans_mode ON scans(mode);
    `);
  }
  return db;
}

/**
 * Save a new scan record to history.
 */
export async function saveScan(params: {
  recognizedText: string;
  characters: RecognizedCharacter[];
  mode: RecognitionMode;
  imageUri: string;
  confidence: number;
}): Promise<ScanRecord> {
  const database = await getDb();
  const charsJson = JSON.stringify(params.characters);

  const result = await database.runAsync(
    `INSERT INTO scans (recognized_text, characters, mode, image_uri, confidence)
     VALUES (?, ?, ?, ?, ?)`,
    [params.recognizedText, charsJson, params.mode, params.imageUri, params.confidence]
  );

  return {
    id: result.lastInsertRowId,
    recognizedText: params.recognizedText,
    characters: params.characters,
    mode: params.mode,
    imageUri: params.imageUri,
    confidence: params.confidence,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Retrieve all scan records, most recent first.
 */
export async function getScans(limit = 50, offset = 0): Promise<ScanRecord[]> {
  const database = await getDb();

  const rows = await database.getAllAsync<{
    id: number;
    recognized_text: string;
    characters: string;
    mode: string;
    image_uri: string;
    confidence: number;
    created_at: string;
  }>(
    `SELECT * FROM scans ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return rows.map(mapRowToScanRecord);
}

/**
 * Search scans by recognized text.
 */
export async function searchScans(query: string): Promise<ScanRecord[]> {
  const database = await getDb();

  const rows = await database.getAllAsync<{
    id: number;
    recognized_text: string;
    characters: string;
    mode: string;
    image_uri: string;
    confidence: number;
    created_at: string;
  }>(
    `SELECT * FROM scans WHERE recognized_text LIKE ? ORDER BY created_at DESC`,
    [`%${query}%`]
  );

  return rows.map(mapRowToScanRecord);
}

/**
 * Delete a scan record by ID.
 */
export async function deleteScan(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM scans WHERE id = ?`, [id]);
}

/**
 * Delete all scan records.
 */
export async function deleteAllScans(): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM scans`);
}

/**
 * Get total number of scans.
 */
export async function getScanCount(): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM scans`
  );
  return result?.count ?? 0;
}

/**
 * Get total number of characters ever recognized.
 */
export async function getTotalCharactersFound(): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ total: number }>(
    `SELECT SUM(LENGTH(recognized_text)) as total FROM scans`
  );
  return result?.total ?? 0;
}

/** Map a database row to a ScanRecord */
function mapRowToScanRecord(row: {
  id: number;
  recognized_text: string;
  characters: string;
  mode: string;
  image_uri: string;
  confidence: number;
  created_at: string;
}): ScanRecord {
  return {
    id: row.id,
    recognizedText: row.recognized_text,
    characters: JSON.parse(row.characters) as RecognizedCharacter[],
    mode: row.mode as RecognitionMode,
    imageUri: row.image_uri,
    confidence: row.confidence,
    createdAt: row.created_at,
  };
}
