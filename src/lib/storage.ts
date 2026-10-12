import type { QueryClient } from "@tanstack/react-query";
import { db, type IdRow, type ImageRow } from "./db";
import { clearLegacyLocalStorage, convertLegacyBackup, readLegacyLocalStorage } from "./legacy";
import { clearTheme, saveTheme } from "./theme";

export const STORAGE_KEYS = {
  settings: "settings",
  tasks: "tasks",
  weeks: "weeks",
  sleepLogs: "sleepLogs",
  notes: "notes",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

type RowKey = "tasks" | "notes";
const isRowKey = (k: StorageKey): k is RowKey => k === "tasks" || k === "notes";

const EMPTY: Record<StorageKey, unknown> = {
  settings: {},
  tasks: [],
  weeks: [],
  sleepLogs: [],
  notes: [],
};

const MIGRATED_FLAG = "migratedFromLocalStorage";

const noteImageIds = (n: unknown): string[] => (n as { images?: string[] }).images ?? [];
const byCreated = (a: IdRow, b: IdRow) => (a.createdAt ?? 0) - (b.createdAt ?? 0);

// ── Reading / writing ────────────────────────────────────────────────────────

export async function loadKey<T>(key: StorageKey, fallback: T): Promise<T> {
  if (isRowKey(key)) {
    const rows = (await db.table(key).toArray()) as IdRow[];
    return rows.sort(byCreated) as T;
  }
  const row = await db.kv.get(key);
  return (row ? row.value : fallback) as T;
}

/** Persist the difference between two versions of a collection. */
export async function saveKey(key: StorageKey, prev: unknown, next: unknown) {
  if (prev === next) return;
  if (isRowKey(key)) return saveRows(key, prev as IdRow[], next as IdRow[]);
  await db.kv.put({ key, value: next });
  if (key === "settings") saveTheme((next as { theme?: unknown } | null)?.theme);
}

async function saveRows(key: RowKey, prev: IdRow[], next: IdRow[]) {
  const prevById = new Map(prev.map((r) => [r.id, r]));
  const nextIds = new Set(next.map((r) => r.id));
  const puts = next.filter((r) => {
    const p = prevById.get(r.id);
    return p !== r && JSON.stringify(p) !== JSON.stringify(r);
  });
  const removed = prev.filter((r) => !nextIds.has(r.id)).map((r) => r.id);
  if (!puts.length && !removed.length) return;

  // Images that no note references any more
  let orphaned: string[] = [];
  if (key === "notes") {
    const stillUsed = new Set(next.flatMap(noteImageIds));
    orphaned = [...new Set(prev.flatMap(noteImageIds))].filter((id) => !stillUsed.has(id));
  }

  const table = db.table(key);
  await db.transaction("rw", table, db.images, async () => {
    if (removed.length) await table.bulkDelete(removed);
    if (puts.length) await table.bulkPut(puts);
    if (orphaned.length) await db.images.bulkDelete(orphaned);
  });
}

// ── Startup ──────────────────────────────────────────────────────────────────

async function preloadStore(qc: QueryClient) {
  await Promise.all(
    Object.values(STORAGE_KEYS).map(async (k) => {
      const value = await loadKey(k, EMPTY[k]);
      qc.setQueryData(["store", k], value);
      if (k === "settings") saveTheme((value as { theme?: unknown }).theme);
    }),
  );
}

/** Copy pre-Dexie localStorage data into IndexedDB once. The old data is left in place. */
async function migrateFromLocalStorage() {
  if (await db.kv.get(MIGRATED_FLAG)) return;
  const legacy = readLegacyLocalStorage();
  if (legacy) await importAll(legacy);
  await db.kv.put({ key: MIGRATED_FLAG, value: Date.now() });
}

/** Drop image blobs left behind by notes that were never saved. */
async function sweepOrphanImages() {
  const used = new Set<string>();
  await db.notes.each((n) => noteImageIds(n).forEach((id) => used.add(id)));
  const ids = (await db.images.toCollection().primaryKeys()) as string[];
  const orphans = ids.filter((id) => !used.has(id));
  if (orphans.length) await db.images.bulkDelete(orphans);
}

let initPromise: Promise<void> | undefined;

/** Migrate if needed, then load everything into the query cache. Safe to call twice. */
export function initStorage(qc: QueryClient) {
  initPromise ??= (async () => {
    await migrateFromLocalStorage();
    await sweepOrphanImages();
    await preloadStore(qc);
    // Ask the browser not to evict our data under storage pressure
    void Promise.resolve(navigator.storage?.persist?.()).catch(() => {});
  })().catch((e) => {
    initPromise = undefined;
    throw e;
  });
  return initPromise;
}

// ── Backup / restore ─────────────────────────────────────────────────────────

/** v2 backup: notes reference image ids, and `images` maps id → data URL. */
export interface Backup {
  version: 2;
  settings?: unknown;
  tasks?: IdRow[];
  weeks?: unknown;
  sleepLogs?: unknown;
  notes?: IdRow[];
  images?: Record<string, string>;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function dataUrlToBlob(url: string): Blob {
  const [head = "", b64 = ""] = url.split(",");
  const mime = /data:([^;,]+)/.exec(head)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function exportAll(): Promise<Backup> {
  const [kv, tasks, notes] = await Promise.all([
    db.kv.toArray(),
    db.tasks.toArray(),
    db.notes.toArray(),
  ]);
  const get = (k: string) => kv.find((r) => r.key === k)?.value;

  const images: Record<string, string> = {};
  for (const id of new Set(notes.flatMap(noteImageIds))) {
    const row = await db.images.get(id);
    if (row) images[id] = await blobToDataUrl(row.blob);
  }

  return {
    version: 2,
    settings: get("settings"),
    tasks: tasks.sort(byCreated),
    weeks: get("weeks"),
    sleepLogs: get("sleepLogs"),
    notes: notes.sort(byCreated),
    images,
  };
}

/** Accepts v2 backups and old (v1) backups. Collections present in the file replace existing ones. */
export async function importAll(input: Record<string, unknown>) {
  const data = (input.version === 2 ? input : convertLegacyBackup(input)) as unknown as Backup;

  const valid = (rows: unknown): IdRow[] | null =>
    Array.isArray(rows)
      ? (rows.filter((r) => r && typeof (r as IdRow).id === "string") as IdRow[])
      : null;
  const tasks = valid(data.tasks);
  const notes = valid(data.notes);
  const imageRows: ImageRow[] = Object.entries(data.images ?? {}).map(([id, url]) => ({
    id,
    blob: dataUrlToBlob(url),
    createdAt: Date.now(),
  }));

  await db.transaction("rw", db.kv, db.tasks, db.notes, db.images, async () => {
    if (data.settings != null) await db.kv.put({ key: "settings", value: data.settings });
    if (data.weeks != null) await db.kv.put({ key: "weeks", value: data.weeks });
    if (data.sleepLogs != null) await db.kv.put({ key: "sleepLogs", value: data.sleepLogs });
    if (tasks) {
      await db.tasks.clear();
      await db.tasks.bulkPut(tasks);
    }
    if (notes) {
      await db.notes.clear();
      await db.images.clear();
      await db.notes.bulkPut(notes);
      await db.images.bulkPut(imageRows);
    }
  });

  saveTheme((data.settings as { theme?: unknown } | null | undefined)?.theme);
}

export async function clearAll() {
  await db.transaction("rw", db.kv, db.tasks, db.notes, db.images, async () => {
    // keep the migration flag so old localStorage data can't come back
    await db.kv.filter((r) => r.key !== MIGRATED_FLAG).delete();
    await db.tasks.clear();
    await db.notes.clear();
    await db.images.clear();
  });
  clearLegacyLocalStorage();
  clearTheme();
}
