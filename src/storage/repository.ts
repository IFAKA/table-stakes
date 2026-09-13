import type { MatchState } from "../game/types";
import { migrateMatch } from "./migrations";

const DB_NAME = "table-stakes";
const STORE = "match";
const KEY = "current";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    const timeout = window.setTimeout(() => reject(new Error("Local storage did not respond. Close other Table Stakes tabs and reload.")), 4000);
    const finish = (callback: () => void) => { window.clearTimeout(timeout); callback(); };
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => finish(() => resolve(request.result));
    request.onerror = () => finish(() => reject(request.error ?? new Error("IndexedDB unavailable")));
    request.onblocked = () => finish(() => reject(new Error("Local storage is blocked by another open Table Stakes tab. Close it and reload.")));
  });
}

export async function loadMatch(): Promise<MatchState | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  try {
    const value = await new Promise<unknown>((resolve, reject) => { const req = db.transaction(STORE).objectStore(STORE).get(KEY); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    return migrateMatch(value);
  } finally { db.close(); }
}

export async function saveMatch(state: MatchState): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  try { await new Promise<void>((resolve, reject) => { const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(state, KEY); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error); }); } finally { db.close(); }
}

export async function clearMatch(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  try { await new Promise<void>((resolve, reject) => { const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(KEY); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error); }); } finally { db.close(); }
}
