const PREFIX = "168hrs:";

export const STORAGE_KEYS = {
  settings: "settings",
  tasks: "tasks",
  weeks: "weeks",
  sleepLogs: "sleepLogs",
  notes: "notes",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function readStore<T>(key: StorageKey, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: StorageKey, value: T) {
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function exportAll() {
  const data: Record<string, unknown> = {};
  Object.values(STORAGE_KEYS).forEach((k) => (data[k] = readStore(k, null)));
  return data;
}

export function importAll(data: Record<string, unknown>) {
  Object.values(STORAGE_KEYS).forEach((k) => {
    if (data[k] !== undefined && data[k] !== null) writeStore(k, data[k]);
  });
}

export function clearAll() {
  Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(PREFIX + k));
}
