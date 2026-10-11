export interface Note {
  id: string;
  /** ISO date the note is associated with (day) */
  date: string;
  title: string;
  body: string;
  lifeAreaId?: string;
  /** Attached images as (downscaled) data URLs */
  images?: string[];
  /** @deprecated single-image notes — migrated lazily to `images` */
  image?: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

/** All images on a note, including notes saved before multi-image support. */
export const noteImages = (n: Pick<Note, "images" | "image">): string[] =>
  n.images ?? (n.image ? [n.image] : []);
