import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { and, count, eq, sum } from "drizzle-orm";
import { HttpError } from "#core/http/httpError.js";
import { registerJob } from "#core/lifecycle.js";
import { logger } from "#core/log.js";
import { getDb } from "#db/client.js";
import { uploadedAssets } from "#db/schema.js";
import {
  getUploadKindDir,
  resolvePublicUploadPath,
  UPLOAD_KINDS,
  type UploadKind,
} from "./dataPaths.js";

/**
 * TEN-01 (PLAN_FINAL_2026.md, §12.4): fuente de verdad de qué archivo
 * pertenece a qué guild, cuánto pesa y quién lo subió — antes un upload no
 * tenía dueño ni cuota, y se servía por `express.static` sin chequear el
 * guild del que pide leerlo. Ver también `dataPaths.ts` (rutas por tenant en
 * disco) y `createApp.ts` (ruta de servido autenticada por guild).
 */

const MAX_ASSETS_PER_GUILD = 200;
const MAX_BYTES_PER_GUILD = 100 * 1024 * 1024;
/** Gracia antes de considerar huérfano un archivo sin fila en DB — evita
 * borrar un upload en curso (multer ya escribió el archivo, el INSERT
 * todavía no confirmó). */
const ORPHAN_GRACE_MS = 60 * 60 * 1000;
const SWEEP_MS = 30 * 60 * 1000;

export async function assertUploadQuota(
  guildId: string,
  incomingBytes: number,
): Promise<void> {
  const [row] = await getDb()
    .select({ n: count(), bytes: sum(uploadedAssets.sizeBytes) })
    .from(uploadedAssets)
    .where(eq(uploadedAssets.guildId, guildId));
  const currentCount = Number(row?.n ?? 0);
  const currentBytes = Number(row?.bytes ?? 0);

  if (currentCount >= MAX_ASSETS_PER_GUILD) {
    throw new HttpError(
      `This server reached the ${MAX_ASSETS_PER_GUILD}-file upload limit. Delete unused files first.`,
      400,
      "UPLOAD_QUOTA_EXCEEDED",
    );
  }
  if (currentBytes + incomingBytes > MAX_BYTES_PER_GUILD) {
    throw new HttpError(
      "This server reached its upload storage limit.",
      400,
      "UPLOAD_QUOTA_EXCEEDED",
    );
  }
}

function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export async function recordUploadedAsset(input: {
  guildId: string;
  ownerId: string;
  kind: UploadKind;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
}): Promise<void> {
  const sha256 = await hashFile(input.filePath);
  await getDb().insert(uploadedAssets).values({
    id: crypto.randomUUID(),
    guildId: input.guildId,
    ownerId: input.ownerId,
    kind: input.kind,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    sha256,
  });
}

/** Borra la fila y el archivo. `false` si no existía (ya borrado / nunca fue de este guild). */
export async function deleteUploadedAsset(
  kind: UploadKind,
  guildId: string,
  filename: string,
): Promise<boolean> {
  const deleted = await getDb()
    .delete(uploadedAssets)
    .where(
      and(
        eq(uploadedAssets.guildId, guildId),
        eq(uploadedAssets.kind, kind),
        eq(uploadedAssets.filename, filename),
      ),
    )
    .returning({ id: uploadedAssets.id });
  if (deleted.length === 0) return false;

  const absolute = resolvePublicUploadPath(
    `/uploads/${kind}/${guildId}/${filename}`,
  );
  if (absolute) await fs.promises.unlink(absolute).catch(() => undefined);
  return true;
}

/**
 * Huérfanos: archivos en disco sin fila en `uploaded_assets` — un crash entre
 * `multer` escribiendo el archivo y el `INSERT`, o el cascade de borrar un
 * guild (que limpia la fila pero no el archivo). Con más de `ORPHAN_GRACE_MS`
 * de antigüedad, se borran.
 */
export async function sweepOrphanedUploads(): Promise<{ removed: number }> {
  let removed = 0;
  const cutoff = Date.now() - ORPHAN_GRACE_MS;

  for (const kind of UPLOAD_KINDS) {
    const kindDir = getUploadKindDir(kind);
    if (!fs.existsSync(kindDir)) continue;

    const guildDirs = await fs.promises.readdir(kindDir, {
      withFileTypes: true,
    });
    for (const guildDir of guildDirs) {
      if (!guildDir.isDirectory()) continue;
      const guildId = guildDir.name;
      const dirPath = path.join(kindDir, guildId);
      const files = await fs.promises.readdir(dirPath);

      for (const filename of files) {
        const stat = await fs.promises
          .stat(path.join(dirPath, filename))
          .catch(() => null);
        if (!stat || stat.mtimeMs > cutoff) continue;

        const [row] = await getDb()
          .select({ id: uploadedAssets.id })
          .from(uploadedAssets)
          .where(
            and(
              eq(uploadedAssets.guildId, guildId),
              eq(uploadedAssets.kind, kind),
              eq(uploadedAssets.filename, filename),
            ),
          )
          .limit(1);
        if (row) continue;

        await fs.promises
          .unlink(path.join(dirPath, filename))
          .catch(() => undefined);
        removed++;
        logger.info(
          { kind, guildId, filename },
          "uploads: huérfano sin fila en DB borrado",
        );
      }
    }
  }

  return { removed };
}

let sweepTimer: ReturnType<typeof setInterval> | null = null;

/** Arranca en las N réplicas de worker; no necesita liderazgo (solo borra huérfanos ya inequívocos). */
export function startOrphanedUploadsSweeper(): void {
  if (sweepTimer) return;
  void sweepOrphanedUploads().catch((error: unknown) => {
    logger.warn({ err: error }, "uploads: sweep de huérfanos falló");
  });
  sweepTimer = setInterval(() => {
    void sweepOrphanedUploads().catch((error: unknown) => {
      logger.warn({ err: error }, "uploads: sweep de huérfanos falló");
    });
  }, SWEEP_MS);
  registerJob("uploads:orphan-sweep", sweepTimer);
}
