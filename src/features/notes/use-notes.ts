import { useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";
import type { Note } from "./note-types";

export type NoteInput = {
  date: string;
  title?: string;
  body?: string;
  lifeAreaId?: string;
  pinned?: boolean;
};

export function useNotes() {
  const { data: notes, update } = useStored<Note[]>(STORAGE_KEYS.notes, []);

  const sorted = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.updatedAt - a.updatedAt;
    });
  }, [notes]);

  const getById = useCallback((id: string) => notes.find((n) => n.id === id), [notes]);

  const addNote = useCallback(
    async (input: NoteInput): Promise<Note> => {
      const now = Date.now();
      const note: Note = {
        id: crypto.randomUUID(),
        date: input.date,
        title: input.title?.trim() ?? "",
        body: input.body ?? "",
        lifeAreaId: input.lifeAreaId,
        pinned: input.pinned ?? false,
        createdAt: now,
        updatedAt: now,
      };
      await update((prev) => [...prev, note]);
      return note;
    },
    [update],
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<Note, "title" | "body" | "lifeAreaId" | "date" | "pinned">>) =>
      update((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
      ),
    [update],
  );

  const deleteNote = useCallback(
    (id: string) => update((prev) => prev.filter((n) => n.id !== id)),
    [update],
  );

  const togglePin = useCallback(
    (id: string) =>
      update((prev) =>
        prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n)),
      ),
    [update],
  );

  return { notes: sorted, getById, addNote, updateNote, deleteNote, togglePin };
}
