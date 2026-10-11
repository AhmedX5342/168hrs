import { useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, NotebookPen, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { formatDate, todayISO } from "@/lib/dates";
import { toast } from "@/lib/toast";
import { useSettings } from "@/features/settings/use-settings";
import { LifeAreaIcon } from "@/features/life-areas/icons";
import { useNotes } from "@/features/notes/use-notes";
import { NoteBody } from "@/features/notes/NoteBody";
import type { Note } from "@/features/notes/note-types";
import type { LifeArea } from "@/features/settings/types";

const NONE = "__none";
/** ?area= values. Anything else is treated as a life area id. */
const ALL_VIEW = "all";
const UNASSIGNED_VIEW = "none";

const plural = (n: number) => `${n} ${n === 1 ? "note" : "notes"}`;

function AreaCard({
  to,
  icon,
  title,
  count,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  count: number;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-soft"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-sans text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{plural(count)}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function NoteRow({
  note,
  area,
  backTo,
  onTogglePin,
  onDelete,
}: {
  note: Note;
  /** Pass to show the life-area chip (omitted inside a single-area view) */
  area?: LifeArea | undefined;
  backTo: string;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const preview =
    note.body
      .trim()
      .split("\n")
      .find((l) => l.trim()) ?? "";

  return (
    <div className="flex items-start gap-2 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-soft">
      <Link
        to={`/notes/${note.id}`}
        state={{ back: backTo }}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {note.pinned && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                Pinned
              </span>
            )}
            {area && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <LifeAreaIcon icon={area.icon} className="size-3.5" />
                {area.name}
              </span>
            )}
          </div>
          <h3 className="mt-1 font-semibold">
            {note.title.trim() || <span className="text-muted-foreground">Untitled</span>}
          </h3>
          {preview && (
            <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              <NoteBody text={preview} className="text-sm text-muted-foreground" />
            </div>
          )}
        </div>
        {note.image && (
          <img
            src={note.image}
            alt=""
            className="size-16 shrink-0 rounded-xl border object-cover"
          />
        )}
      </Link>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={note.pinned ? "Unpin" : "Pin"}
          onClick={onTogglePin}
        >
          {note.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function NotesPage() {
  const { settings } = useSettings();
  const { notes, addNote, deleteNote, togglePin } = useNotes();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [lifeAreaId, setLifeAreaId] = useState(NONE);

  const lifeAreas = settings.lifeAreas;
  const areaParam = searchParams.get("area");
  const currentArea = lifeAreas.find((a) => a.id === areaParam);
  const view: "root" | "all" | "unassigned" | "area" =
    areaParam === ALL_VIEW
      ? "all"
      : areaParam === UNASSIGNED_VIEW
        ? "unassigned"
        : currentArea
          ? "area"
          : "root";

  // Notes whose life area was deleted count as unassigned
  const knownIds = useMemo(() => new Set(lifeAreas.map((a) => a.id)), [lifeAreas]);
  const isUnassigned = (n: Note) => !n.lifeAreaId || !knownIds.has(n.lifeAreaId);

  const counts = useMemo(() => {
    const byArea = new Map<string, number>();
    let unassigned = 0;
    for (const n of notes) {
      if (!n.lifeAreaId || !knownIds.has(n.lifeAreaId)) unassigned++;
      else byArea.set(n.lifeAreaId, (byArea.get(n.lifeAreaId) ?? 0) + 1);
    }
    return { byArea, unassigned };
  }, [notes, knownIds]);

  // `notes` is already sorted: pinned first, then date desc, then updatedAt desc
  const visible = useMemo(() => {
    if (view === "all") return notes;
    if (view === "unassigned") return notes.filter(isUnassigned);
    if (view === "area") return notes.filter((n) => n.lifeAreaId === currentArea?.id);
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, view, currentArea?.id, knownIds]);

  const pinned = useMemo(() => visible.filter((n) => n.pinned), [visible]);
  const byDate = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const n of visible) {
      if (n.pinned) continue;
      const list = map.get(n.date) ?? [];
      list.push(n);
      map.set(n.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [visible]);

  if (!settings.notesEnabled) return <Navigate to="/" replace />;

  const backTo = `${location.pathname}${location.search}`;

  const openCreate = () => {
    // Inside a life area, preselect it in the form
    setLifeAreaId(view === "area" && currentArea ? currentArea.id : NONE);
    setCreateOpen(true);
  };

  const create = async () => {
    const note = await addNote({
      date: todayISO(),
      lifeAreaId: lifeAreaId === NONE ? undefined : lifeAreaId,
      body: "",
      title: "",
    });
    setCreateOpen(false);
    toast.success("Note created");
    navigate(`/notes/${note.id}`, { state: { back: backTo } });
  };

  const confirmDelete = (n: Note) => {
    if (!window.confirm("Delete this note?")) return;
    void deleteNote(n.id);
    toast.success("Note deleted");
  };

  const row = (n: Note) => (
    <NoteRow
      key={n.id}
      note={n}
      area={view === "area" ? undefined : lifeAreas.find((a) => a.id === n.lifeAreaId)}
      backTo={backTo}
      onTogglePin={() => void togglePin(n.id)}
      onDelete={() => confirmDelete(n)}
    />
  );

  const title =
    view === "all"
      ? "All notes"
      : view === "unassigned"
        ? "No life area"
        : (currentArea?.name ?? "Notes");

  return (
    <>
      {view !== "root" && (
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4">
          <Link to="/notes">
            <ArrowLeft /> Back to notes
          </Link>
        </Button>
      )}

      <PageHeader
        eyebrow={view === "root" ? "Journal" : "Notes"}
        title={title}
        actions={
          <Button onClick={openCreate}>
            <Plus /> New note
          </Button>
        }
      />

      {view === "root" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AreaCard
            to={`/notes?area=${ALL_VIEW}`}
            icon={<NotebookPen className="size-5" />}
            title="All notes"
            count={notes.length}
          />
          {lifeAreas.map((a) => (
            <AreaCard
              key={a.id}
              to={`/notes?area=${encodeURIComponent(a.id)}`}
              icon={<LifeAreaIcon icon={a.icon} className="size-5" />}
              title={a.name}
              count={counts.byArea.get(a.id) ?? 0}
            />
          ))}
          {counts.unassigned > 0 && (
            <AreaCard
              to={`/notes?area=${UNASSIGNED_VIEW}`}
              icon={<LifeAreaIcon icon={undefined} className="size-5" />}
              title="No life area"
              count={counts.unassigned}
            />
          )}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed px-6 py-16 text-center">
          <p className="font-display text-3xl">No notes yet</p>
          <p className="mt-2 text-muted-foreground">
            {view === "area"
              ? `Capture thoughts for ${currentArea?.name}.`
              : "Capture thoughts tied to a day and life area."}
          </p>
          <Button className="mt-6" onClick={openCreate}>
            <Plus /> Create first note
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {pinned.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Pin className="size-3.5" /> Pinned
              </h2>
              <div className="space-y-2">{pinned.map(row)}</div>
            </section>
          )}
          {byDate.map(([date, list]) => (
            <section key={date}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {formatDate(date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div className="space-y-2">{list.map(row)}</div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-normal">New note</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Dated today (
            {formatDate(todayISO(), { day: "numeric", month: "short", year: "numeric" })}). You can
            edit the body and attach an image on the next screen.
          </p>
          <div className="space-y-1.5">
            <Label>Life area</Label>
            <Select value={lifeAreaId} onValueChange={setLifeAreaId}>
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {lifeAreas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="flex items-center gap-2">
                      <LifeAreaIcon icon={a.icon} className="size-4" />
                      {a.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void create()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
