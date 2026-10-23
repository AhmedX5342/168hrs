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

  // Always emit every collection so backups are complete and re-importable
  return {
    version: 2,
    settings: structuredClone(get("settings") ?? {}),
    tasks: tasks.sort(byCreated),
    weeks: structuredClone(get("weeks") ?? []),
    sleepLogs: structuredClone(get("sleepLogs") ?? []),
    notes: notes.sort(byCreated),
    images,
  };
}

/** Clone plain JSON so Dexie never holds live React/query object graphs. */
function cloneJson<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/**
 * Accepts v2 backups and old (v1) backups (no version, images inside notes).
 * Every collection present in the file replaces the matching store.
 * Always returns the normalized payload that was written (for cache hydration).
 */
export async function importAll(input: Record<string, unknown>): Promise<Backup> {
  // Support files that wrap payload under { data: {...} } or { backup: {...} }
  const root =
    input && typeof input === "object" && !Array.isArray(input)
      ? ((input.data as Record<string, unknown> | undefined) ??
        (input.backup as Record<string, unknown> | undefined) ??
        input)
      : (input as Record<string, unknown>);

  const data = (root.version === 2 ? root : convertLegacyBackup(root)) as unknown as Backup;

  const valid = (rows: unknown): IdRow[] | null =>
    Array.isArray(rows)
      ? (rows.filter((r) => r && typeof (r as IdRow).id === "string") as IdRow[])
      : null;
  const tasks = valid(data.tasks);
  const notes = valid(data.notes);

  // Settings: accept object only; deep-clone so nested lifeAreas are preserved
  const settings =
    data.settings != null && typeof data.settings === "object" && !Array.isArray(data.settings)
      ? cloneJson(data.settings)
      : null;

  const weeks = Array.isArray(data.weeks)
    ? cloneJson(data.weeks)
    : data.weeks != null
      ? data.weeks
      : null;
  const sleepLogs = Array.isArray(data.sleepLogs)
    ? cloneJson(data.sleepLogs)
    : data.sleepLogs != null
      ? data.sleepLogs
      : null;

  const imageRows: ImageRow[] = Object.entries(data.images ?? {}).flatMap(([id, url]) => {
    try {
      if (typeof url !== "string") return [];
      return [{ id, blob: dataUrlToBlob(url), createdAt: Date.now() }];
    } catch {
      return [];
    }
  });

  await db.transaction("rw", db.kv, db.tasks, db.notes, db.images, async () => {
    if (settings) await db.kv.put({ key: "settings", value: settings });
    if (weeks != null) await db.kv.put({ key: "weeks", value: weeks });
    if (sleepLogs != null) await db.kv.put({ key: "sleepLogs", value: sleepLogs });
    if (tasks) {
      await db.tasks.clear();
      if (tasks.length) await db.tasks.bulkPut(cloneJson(tasks));
    }
    if (notes) {
      await db.notes.clear();
      await db.images.clear();
      if (notes.length) await db.notes.bulkPut(cloneJson(notes));
      if (imageRows.length) await db.images.bulkPut(imageRows);
    }
  });

  if (settings) saveTheme((settings as { theme?: unknown }).theme);

  return {
    version: 2,
    settings: settings ?? undefined,
    tasks: tasks ?? undefined,
    weeks: weeks ?? undefined,
    sleepLogs: sleepLogs ?? undefined,
    notes: notes ?? undefined,
    images: data.images,
  };
}

/** Push imported values into React Query so the UI updates without a full reload. */
export async function hydrateStoreCache(qc: QueryClient, imported?: Backup) {
  if (imported?.settings != null)
    qc.setQueryData(["store", STORAGE_KEYS.settings], imported.settings);
  if (imported?.tasks) qc.setQueryData(["store", STORAGE_KEYS.tasks], imported.tasks);
  if (imported?.weeks != null) qc.setQueryData(["store", STORAGE_KEYS.weeks], imported.weeks);
  if (imported?.sleepLogs != null)
    qc.setQueryData(["store", STORAGE_KEYS.sleepLogs], imported.sleepLogs);
  if (imported?.notes) qc.setQueryData(["store", STORAGE_KEYS.notes], imported.notes);

  // Also re-read from Dexie so cache matches disk even if a field was omitted above
  await Promise.all(
    Object.values(STORAGE_KEYS).map(async (k) => {
      const value = await loadKey(k, EMPTY[k]);
      qc.setQueryData(["store", k], value);
    }),
  );
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

/** Delete all tasks only. Keeps notes, settings, life areas, sleep logs. */
export async function clearTasks() {
  await db.tasks.clear();
}

/** Delete all notes and their image blobs. Keeps tasks and settings. */
export async function clearNotes() {
  await db.transaction("rw", db.notes, db.images, async () => {
    await db.notes.clear();
    await db.images.clear();
  });
}

/**
 * Reset preferences (name, theme, sleep, life areas, flags) to defaults.
 * Keeps tasks and notes. Sleep logs are cleared with settings.
 */
export async function clearSettings() {
  await db.transaction("rw", db.kv, async () => {
    await db.kv.delete("settings");
    await db.kv.delete("sleepLogs");
  });
  clearTheme();
}
