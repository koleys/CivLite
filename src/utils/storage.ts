import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'civlite-game';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

interface SaveData {
  id: string;
  name: string;
  timestamp: number;
  turn: number;
  age: string;
  settings: object;
  state: object;
  checksum?: string;
}

let db: IDBPDatabase | null = null;

async function generateChecksum(data: object): Promise<string> {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function validateChecksum(data: object, expectedChecksum: string): Promise<boolean> {
  const actualChecksum = await generateChecksum(data);
  return actualChecksum === expectedChecksum;
}

async function getDB(): Promise<IDBPDatabase> {
  if (db) return db;
  
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
  
  return db;
}

export async function saveGame(
  id: string,
  name: string,
  state: object,
  metadata: { turn: number; age: string; settings: object }
): Promise<void> {
  const database = await getDB();
  const checksum = await generateChecksum(state);
  const saveData: SaveData = {
    id,
    name,
    timestamp: Date.now(),
    turn: metadata.turn,
    age: metadata.age,
    settings: metadata.settings,
    state,
    checksum,
  };
  await database.put(STORE_NAME, saveData);
}

export async function loadGame(id: string): Promise<SaveData | undefined> {
  const database = await getDB();
  return database.get(STORE_NAME, id);
}

export async function validateSave(id: string): Promise<{ valid: boolean; error?: string }> {
  const database = await getDB();
  const saveData = await database.get(STORE_NAME, id);
  
  if (!saveData) {
    return { valid: false, error: 'Save not found' };
  }

  if (!saveData.checksum) {
    return { valid: false, error: 'Save file is corrupted - missing checksum' };
  }

  const isValid = await validateChecksum(saveData.state, saveData.checksum);
  
  if (!isValid) {
    return { valid: false, error: 'Save file may be corrupted - checksum mismatch' };
  }

  return { valid: true };
}

export async function deleteSave(id: string): Promise<void> {
  const database = await getDB();
  await database.delete(STORE_NAME, id);
}

export async function listSaves(): Promise<SaveData[]> {
  const database = await getDB();
  const saves = await database.getAll(STORE_NAME);
  return saves.sort((a, b) => b.timestamp - a.timestamp);
}

export async function hasSave(id: string): Promise<boolean> {
  const database = await getDB();
  const save = await database.get(STORE_NAME, id);
  return save !== undefined;
}

export async function getSaveSize(): Promise<number> {
  const database = await getDB();
  const saves = await database.getAll(STORE_NAME);
  const totalBytes = saves.reduce((acc, save) => {
    return acc + new Blob([JSON.stringify(save)]).size;
  }, 0);
  return totalBytes;
}

export async function clearAllSaves(): Promise<void> {
  const database = await getDB();
  const tx = database.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
}
