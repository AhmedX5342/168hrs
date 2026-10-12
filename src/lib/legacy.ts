/**
 * Everything needed to read data from before the Dexie migration:
 *  - the old localStorage layout ("168hrs:<key>")
 *  - old backup files (v1: images embedded as data URLs inside notes, no "version")
 * Delete this file (and its 3 call sites in storage.ts) once old backups are no longer needed.
 */
const PREFIX = "168hrs:";
const KEYS = ["settings", "tasks", "weeks", "sleepLogs", "notes"] as const;

export function readLegacyLocalStorage(): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  let found = false;
  for (const k of KEYS) {
    try {
      const raw = localStorage.getItem(PREFIX + k);
      if (raw) {
        out[k] = JSON.parse(raw);
        found = true;
      }
    } catch {
      /* skip unreadable key */
    }
  }
  return found ? out : null;
}

export function clearLegacyLocalStorage() {
  for (const k of KEYS) localStorage.removeItem(PREFIX + k);
}

type LegacyNote = { images?: string[]; image?: string; [k: string]: unknown };

/** v1 → v2: move data-URL images out of notes into a separate id → data URL map. */
export function convertLegacyBackup(data: Record<string, unknown>): Record<string, unknown> {
  const images: Record<string, string> = {};
  const notes = Array.isArray(data.notes)
    ? (data.notes as LegacyNote[]).map((n) => {
        const urls = n.images ?? (n.image ? [n.image] : []);
        const ids = urls.map((url) => {
          if (!url.startsWith("data:")) return url;
          const id = crypto.randomUUID();
          images[id] = url;
          return id;
        });
        const note = { ...n, images: ids };
        delete note.image;
        return note;
      })
    : data.notes;
  return { ...data, version: 2, notes, images };
}
