import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const STEP = 1.25;
const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

interface Props {
  images: string[];
  /** Index of the open image, or null when closed */
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

/**
 * Full-screen image modal. At 1× the image fits the screen; zooming enlarges it
 * inside a scrollable area so you can pan with scroll / drag-scroll / touch.
 */
export function ImageViewer({ images, index, onIndexChange, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const open = index !== null && images[index] !== undefined;

  // Reset zoom whenever the image changes or the modal reopens
  useEffect(() => setZoom(1), [index]);

  if (!open || index === null) return null;
  const src = images[index]!;
  const multiple = images.length > 1;

  const go = (delta: number) => onIndexChange((index + delta + images.length) % images.length);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="h-screen max-w-none gap-0 border-0 bg-black/95 p-0 text-white sm:rounded-none"
        onKeyDown={(e) => {
          if (e.key === "+" || e.key === "=") setZoom((z) => clamp(z * STEP));
          else if (e.key === "-") setZoom((z) => clamp(z / STEP));
          else if (e.key === "0") setZoom(1);
          else if (multiple && e.key === "ArrowRight") go(1);
          else if (multiple && e.key === "ArrowLeft") go(-1);
        }}
      >
        <DialogTitle className="sr-only">
          Image {index + 1} of {images.length}
        </DialogTitle>

        {/* Scrollable canvas */}
        <div className="absolute inset-0 overflow-auto">
          <div style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
            <img
              src={src}
              alt={`Image ${index + 1} of ${images.length}`}
              draggable={false}
              onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2.5))}
              className="size-full select-none object-contain"
              style={{ cursor: zoom > 1 ? "zoom-out" : "zoom-in" }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-full bg-black/60 p-1 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-white hover:bg-white/20 hover:text-white"
            aria-label="Zoom out"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => setZoom((z) => clamp(z / STEP))}
          >
            <Minus />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-white hover:bg-white/20 hover:text-white"
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom((z) => clamp(z * STEP))}
          >
            <Plus />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-white hover:bg-white/20 hover:text-white"
            aria-label="Reset zoom"
            disabled={zoom === 1}
            onClick={() => setZoom(1)}
          >
            <RotateCcw />
          </Button>
        </div>

        {multiple && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-white/20 hover:text-white"
              aria-label="Previous image"
              onClick={() => go(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-white/20 hover:text-white"
              aria-label="Next image"
              onClick={() => go(1)}
            >
              <ChevronRight />
            </Button>
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs tabular-nums">
              {index + 1} / {images.length}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
