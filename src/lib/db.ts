// IndexedDB 存储层（草稿 + 最近文件）
import { openDB, type IDBPDatabase } from "idb";
import type { Draft, RecentFile } from "@/types";

const DB_NAME = "inkwell-db";
const DB_VERSION = 1;
const DRAFTS_STORE = "drafts";
const RECENT_STORE = "recent";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
          const store = db.createObjectStore(DRAFTS_STORE, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains(RECENT_STORE)) {
          const store = db.createObjectStore(RECENT_STORE, { keyPath: "path" });
          store.createIndex("updatedAt", "updatedAt");
        }
      },
    });
  }
  return dbPromise;
}

// ---- 草稿 ----

export async function listDrafts(): Promise<Draft[]> {
  const db = await getDB();
  const all = (await db.getAllFromIndex(DRAFTS_STORE, "updatedAt")) as Draft[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getDraft(id: string): Promise<Draft | undefined> {
  const db = await getDB();
  return (await db.get(DRAFTS_STORE, id)) as Draft | undefined;
}

export async function saveDraft(draft: Draft): Promise<void> {
  const db = await getDB();
  await db.put(DRAFTS_STORE, draft);
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(DRAFTS_STORE, id);
}

// ---- 最近发布的文件 ----

export async function listRecent(): Promise<RecentFile[]> {
  const db = await getDB();
  const all = (await db.getAllFromIndex(RECENT_STORE, "updatedAt")) as RecentFile[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
}

export async function addRecent(file: RecentFile): Promise<void> {
  const db = await getDB();
  await db.put(RECENT_STORE, file);
}

export async function clearRecent(): Promise<void> {
  const db = await getDB();
  await db.clear(RECENT_STORE);
}

/** 生成简易 UUID */
export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
