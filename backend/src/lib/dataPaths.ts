import fs from "node:fs";
import path from "node:path";

export type UploadKind = "backgrounds" | "images" | "templates";
export const UPLOAD_KINDS: readonly UploadKind[] = [
  "backgrounds",
  "images",
  "templates",
];

/** Directorio de datos (uploads). Independiente de DATABASE_URL. */
export function getDataRoot(): string {
  const raw = process.env.DATA_DIR?.trim();
  if (raw) return path.resolve(raw);
  return path.resolve("./data");
}

export function getUploadsRoot(): string {
  return path.join(getDataRoot(), "uploads");
}

export function getUploadKindDir(kind: UploadKind): string {
  return path.join(getUploadsRoot(), kind);
}

/** TEN-01: por tenant — `uploads/<kind>/<guildId>/`. */
export function getTenantUploadDir(kind: UploadKind, guildId: string): string {
  const dir = path.join(getUploadKindDir(kind), guildId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Convierte `/uploads/<kind>/<guildId>/x.png` → ruta absoluta segura.
 * Rechaza path traversal.
 */
export function resolvePublicUploadPath(publicPath: string): string | null {
  const trimmed = publicPath.trim();
  if (!trimmed.startsWith("/uploads/")) return null;

  const relative = trimmed.slice("/uploads/".length);
  if (!relative || relative.includes("\0")) return null;

  const uploadsRoot = path.resolve(getUploadsRoot());
  const absolute = path.resolve(uploadsRoot, relative);
  if (
    absolute !== uploadsRoot &&
    !absolute.startsWith(`${uploadsRoot}${path.sep}`)
  ) {
    return null;
  }
  return absolute;
}

/**
 * TEN-01: valida que un path público (`/uploads/<kind>/<guildId>/<file>`)
 * pertenezca al guild indicado — sin esto, el guild A podía guardar en su
 * configuración la URL de un upload ya existente del guild B (adivinado o
 * filtrado) y "tomar prestado" ese archivo.
 */
export function uploadBelongsToGuild(
  publicPath: string,
  guildId: string,
): boolean {
  const trimmed = publicPath.trim();
  if (!trimmed.startsWith("/uploads/")) return false;
  const segments = trimmed.slice("/uploads/".length).split("/");
  return (
    segments.length === 3 && segments[1] === guildId && segments.every(Boolean)
  );
}
