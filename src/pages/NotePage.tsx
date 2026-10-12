import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pin, PinOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/dates";
import { toast } from "@/lib/toast";
import { useSettings } from "@/features/settings/use-settings";
import { LifeAreaIcon } from "@/features/life-areas/icons";
import { useNotes } from "@/features/notes/use-notes";

const NONE = "__none";

export function NotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { settings } = useSettings();
  const { getById, updateNote, deleteNote, togglePin } = useNotes();
  const navigate = useNavigate();
  const note = noteId ? getById(noteId) : undefined;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [lifeAreaId, setLifeAreaId] = useState(NONE);

  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setBody(note.body);
    setLifeAreaId(note.lifeAreaId ?? NONE);
  }, [note?.id, note?.updatedAt]);

  if (!settings.notesEnabled) return <Navigate to="/" replace />;
  if (!note) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Note not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/notes">Back to notes</Link>
        </Button>
      </div>
    );
  }

  const save = async () => {
    await updateNote(note.id, {
      title: title.trim(),
      body,
      lifeAreaId: lifeAreaId === NONE ? undefined : lifeAreaId,
    });
    toast.success("Saved");
  };

  return (
    <article className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/notes">
            <ArrowLeft /> Notes
          </Link>
        </Button>
        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void togglePin(note.id)}
            aria-label={note.pinned ? "Unpin" : "Pin"}
          >
            {note.pinned ? <PinOff /> : <Pin />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!window.confirm("Delete this note?")) return;
              void deleteNote(note.id);
              toast.success("Note deleted");
              navigate("/notes");
            }}
          >
            <Trash2 />
          </Button>
          <Button size="sm" onClick={() => void save()}>
            Save
          </Button>
        </div>
      </div>

      <header className="mb-8 border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {formatDate(note.date, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="mt-2 h-auto border-0 bg-transparent px-0 font-display text-4xl shadow-none focus-visible:ring-0 sm:text-5xl"
        />
        <div className="mt-4 max-w-xs space-y-1.5">
          <Label className="text-xs text-muted-foreground">Life area</Label>
          <Select value={lifeAreaId} onValueChange={setLifeAreaId}>
            <SelectTrigger>
              <SelectValue />
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
      </header>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write freely…"
        className="min-h-[50vh] resize-y border-0 bg-transparent px-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
      />
    </article>
  );
}
