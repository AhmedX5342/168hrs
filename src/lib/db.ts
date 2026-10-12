import Dexie, { type Table } from "dexie";

/** Small values stored by key: settings, weeks, sleepLogs, and internal flags. */
export interface KvRow {
  key: string;
  value: unknown;
}

/** Tasks and notes: one row each, so saving one only writes that row. */
export interface IdRow {
  id: string;
  createdAt?: number;
}

/** Note images as real blobs (no base64 overhead, no 5MB limit). */
export interface ImageRow {
  id: string;
  blob: Blob;
  createdAt: number;
}

class AppDB extends Dexie {
  kv!: Table<KvRow, string>;
  tasks!: Table<IdRow, string>;
  notes!: Table<IdRow, string>;
  images!: Table<ImageRow, string>;

  constructor() {
    super("168hrs");
    this.version(1).stores({
      kv: "key",
      tasks: "id",
      notes: "id, date",
      images: "id",
    });
  }
}

export const db = new AppDB();
