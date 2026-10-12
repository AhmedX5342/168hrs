import { db } from "./db";

/**
 * Note images are downscaled and re-encoded as JPEG, then stored as blobs in IndexedDB.
 * Notes only keep the returned image id.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });
}

async function toJpegBlob(file: File, maxDim = 2048, quality = 0.86): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  const img = await loadImage(file);
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image");
  // JPEG has no alpha — paint white so transparent PNGs don't turn black
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not process that image"))),
      "image/jpeg",
      quality,
    ),
  );
}

/** Store an image and return its id. */
export async function saveImage(file: File): Promise<string> {
  const blob = await toJpegBlob(file);
  const id = crypto.randomUUID();
  await db.images.put({ id, blob, createdAt: Date.now() });
  return id;
}
