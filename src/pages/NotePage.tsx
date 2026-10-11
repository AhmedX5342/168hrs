import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Pin, PinOff, Trash2, X } from "lucide-react";
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
import { fileToDataUrl } from "@/lib/image";
import { toast } from "@/lib/toast";
import { useSettings } from "@/features/settings/use-settings";
import { LifeAreaIcon } from "@/features/life-areas/icons";
import { useNotes } from "@/features/notes/use-notes";
import { noteImages } from "@/features/notes/note-types";
import { ImageViewer } from "@/features/notes/ImageViewer";

const NONE = "__none";
const MAX_IMAGES = 10;

export function NotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { settings } = useSettings();
  const { getById, updateNote, deleteNote, togglePin } = useNotes();
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const note = noteId ? getById(noteId) : undefined;

  // Where the user came from (an area view or "all notes"); falls back to the area selection
  const backTo = (location.state as { back?: string } | null)?.back ?? "/notes";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [lifeAreaId, setLifeAreaId] = useState(NONE);
  const [images, setImages] = useState<string[]>([]);
  const [viewing, setViewing] = useState<number | null>(null);

  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setBody(note.body);
    setLifeAreaId(note.lifeAreaId ?? NONE);
    setImages(noteImages(note));
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

  const addImages = async (files: File[]) => {
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`Up to ${MAX_IMAGES} images per note`);
      return;
    }
    const picked = files.slice(0, room);
    if (files.length > room) toast.info(`Only added ${room} — max ${MAX_IMAGES} images per note`);
    const results = await Promise.allSettled(picked.map((f) => fileToDataUrl(f)));
    const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.length - ok.length;
    if (ok.length) setImages((prev) => [...prev, ...ok]);
    if (failed) toast.error(`${failed} image${failed > 1 ? "s" : ""} couldn't be attached`);
  };

  const save = async () => {
    try {
      await updateNote(note.id, {
        title: title.trim(),
        body,
        images,
        lifeAreaId: lifeAreaId === NONE ? undefined : lifeAreaId,
      });
      toast.success("Saved");
    } catch {
      toast.error("Couldn't save", "Browser storage may be full — try a smaller image.");
    }
  };

  return (
    <article className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to={backTo}>
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
            aria-label="Delete note"
            onClick={() => {
              if (!window.confirm("Delete this note?")) return;
              void deleteNote(note.id);
              toast.success("Note deleted");
              navigate(backTo);
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

      {/* Image attachments */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) void addImages(files);
          e.target.value = ""; // allow re-picking the same files
        }}
      />
      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((src, i) => (
            <div
              key={i}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
            >
              <button
                type="button"
                aria-label={`Open image ${i + 1}`}
                className="size-full cursor-zoom-in"
                onClick={() => setViewing(i)}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label={`Remove image ${i + 1}`}
                className="absolute right-1.5 top-1.5 size-7 rounded-full opacity-90 shadow"
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="mb-6 border-dashed"
        disabled={images.length >= MAX_IMAGES}
        onClick={() => fileRef.current?.click()}
      >
        <ImagePlus /> {images.length ? "Add more images" : "Attach images"}
      </Button>
      <ImageViewer
        images={images}
        index={viewing}
        onIndexChange={setViewing}
        onClose={() => setViewing(null)}
      />

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write freely…"
        className="min-h-[50vh] resize-y border-0 bg-transparent px-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
      />
    </article>
  );
}
