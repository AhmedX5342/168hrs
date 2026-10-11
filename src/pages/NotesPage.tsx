import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Pin, PinOff, Plus, Trash2 } from "lucide-react";
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

const NONE = "__none";

export function NotesPage() {
  const { settings } = useSettings();
  const { notes, addNote, deleteNote, togglePin } = useNotes();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [lifeAreaId, setLifeAreaId] = useState(NONE);

  const byDate = useMemo(() => {
    const map = new Map<string, typeof notes>();
    for (const n of notes) {
      const list = map.get(n.date) ?? [];
      list.push(n);
      map.set(n.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [notes]);

  if (!settings.notesEnabled) return <Navigate to="/" replace />;

  const create = async () => {
    const note = await addNote({
      date: todayISO(),
      lifeAreaId: lifeAreaId === NONE ? undefined : lifeAreaId,
      body: "",
      title: "",
    });
    setCreateOpen(false);
    setLifeAreaId(NONE);
    toast.success("Note created");
    navigate(`/notes/${note.id}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Journal"
        title="Notes"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New note
          </Button>
        }
      />

      {notes.length === 0 ? (
        <div className="rounded-3xl border border-dashed px-6 py-16 text-center">
          <p className="font-display text-3xl">No notes yet</p>
          <p className="mt-2 text-muted-foreground">
            Capture thoughts tied to a day and life area.
          </p>
          <Button className="mt-6" onClick={() => setCreateOpen(true)}>
            <Plus /> Create first note
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
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
              <div className="space-y-2">
                {list.map((n) => {
                  const area = settings.lifeAreas.find((a) => a.id === n.lifeAreaId);
                  const preview =
                    n.body
                      .trim()
                      .split("\n")
                      .find((l) => l.trim()) ?? "";
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-2 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-soft"
                    >
                      <Link to={`/notes/${n.id}`} className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {n.pinned && (
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
                          {n.title.trim() || (
                            <span className="text-muted-foreground">Untitled</span>
                          )}
                        </h3>
                        {preview && (
                          <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            <NoteBody text={preview} className="text-sm text-muted-foreground" />
                          </div>
                        )}
                      </Link>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={n.pinned ? "Unpin" : "Pin"}
                          onClick={() => void togglePin(n.id)}
                        >
                          {n.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => {
                            if (!window.confirm("Delete this note?")) return;
                            void deleteNote(n.id);
                            toast.success("Note deleted");
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
            edit the body on the next screen.
          </p>
          <div className="space-y-1.5">
            <Label>Life area</Label>
            <Select value={lifeAreaId} onValueChange={setLifeAreaId}>
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {settings.lifeAreas.map((a) => (
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
