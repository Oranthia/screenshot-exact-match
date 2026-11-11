export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/quicktime"] as const;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB (limite dello storage)

export type MediaKind = "photo" | "video";

export function validateMedia(file: { type: string; size: number; name: string }):
  | { ok: true; kind: MediaKind }
  | { ok: false; error: string } {
  const type = file.type || (file.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "");
  if ((PHOTO_TYPES as readonly string[]).includes(type)) {
    if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: `"${file.name}" supera il limite di 10 MB per le foto.` };
    return { ok: true, kind: "photo" };
  }
  if ((VIDEO_TYPES as readonly string[]).includes(type)) {
    if (file.size > MAX_VIDEO_BYTES) return { ok: false, error: `"${file.name}" supera il limite di 50 MB per i video.` };
    return { ok: true, kind: "video" };
  }
  return { ok: false, error: `"${file.name}": formato non supportato. Usa JPEG, PNG, WebP, MP4 o MOV.` };
}

export function mediaContentType(file: { type: string; name: string }) {
  return file.type || (file.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "application/octet-stream");
}
