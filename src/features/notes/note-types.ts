export interface Note {
  id: string;
  /** ISO date the note is associated with (day) */
  date: string;
  title: string;
  body: string;
  lifeAreaId?: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}
