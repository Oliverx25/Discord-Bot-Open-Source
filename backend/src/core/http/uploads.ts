import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import multer from "multer";
import { guildIdOf } from "#core/http/guildContext.js";
import { HttpError } from "#core/http/httpError.js";
import { getTenantUploadDir } from "#lib/dataPaths.js";
import { sniffImageFile } from "#lib/imageMagic.js";
import {
  assertUploadQuota,
  deleteUploadedAsset,
  recordUploadedAsset,
} from "#lib/uploadedAssets.js";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const MAX_BYTES = 5 * 1024 * 1024;

function safeImageExt(originalname: string): string {
  const ext = path.extname(originalname).toLowerCase();
  if (ext === ".png" || ext === ".webp") return ext;
  if (ext === ".jpg" || ext === ".jpeg") return ".jpg";
  return ".png";
}

/**
 * TEN-01: cuota antes de que multer escriba nada — usa `Content-Length` como
 * cota superior del tamaño entrante (el multipart real pesa un poco más por
 * los boundaries, pero sirve de sobra como salvaguarda operativa, no como
 * límite exacto).
 */
function enforceUploadQuota(): (
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  return (req, _res, next) => {
    const guildId = guildIdOf(req);
    const incoming = Number(req.headers["content-length"] ?? 0);
    assertUploadQuota(guildId, incoming).then(
      () => next(),
      (error: unknown) => next(error),
    );
  };
}

function createUploader(kind: "backgrounds" | "images") {
  const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        cb(null, getTenantUploadDir(kind, guildIdOf(req)));
      } catch (error) {
        cb(error as Error, "");
      }
    },
    filename: (_req, file, cb) => {
      cb(
        null,
        `${Date.now()}-${randomUUID().slice(0, 8)}${safeImageExt(file.originalname)}`,
      );
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        cb(new Error("Only PNG, JPG or WEBP images are allowed (max 5MB)."));
        return;
      }
      cb(null, true);
    },
  });
}

const uploadBackground = createUploader("backgrounds");
const uploadImage = createUploader("images");

async function handleUpload(
  req: Request,
  res: Response,
  kind: "backgrounds" | "images",
): Promise<void> {
  if (!req.file) {
    throw new HttpError("No file received (field `file`).", 400, "NO_FILE");
  }

  const sniffed = sniffImageFile(req.file.path);
  if (!sniffed) {
    fs.unlink(req.file.path, () => undefined);
    throw new HttpError(
      "The file is not a valid PNG, JPG or WEBP image.",
      400,
      "INVALID_IMAGE_CONTENT",
    );
  }

  const guildId = guildIdOf(req);
  await recordUploadedAsset({
    guildId,
    ownerId: req.panelSession?.userId ?? "unknown",
    kind,
    filename: req.file.filename,
    mimeType: sniffed,
    sizeBytes: req.file.size,
    filePath: req.file.path,
  });

  const publicPath = `/uploads/${kind}/${guildId}/${req.file.filename}`;
  res.json({
    ok: true as const,
    path: publicPath,
    filename: req.file.filename,
    size: req.file.size,
    mimeType: sniffed,
  });
}

export function uploadRoutes(): Router {
  const router = Router();

  // Multer va como middleware directo: propaga sus errores con `next(err)`.
  // El throw síncrono de `handleUpload` (HttpError) lo enruta Express al
  // errorHandler — sin envoltorio try/catch.

  /** POST /api/uploads/background — fondos de bienvenida → /uploads/backgrounds/<guildId>/ */
  router.post(
    "/background",
    enforceUploadQuota(),
    uploadBackground.single("file"),
    (req, res, next) => {
      handleUpload(req, res, "backgrounds").catch(next);
    },
  );

  /** POST /api/uploads/image — embeds / iconos / genérico → /uploads/images/<guildId>/ */
  router.post(
    "/image",
    enforceUploadQuota(),
    uploadImage.single("file"),
    (req, res, next) => {
      handleUpload(req, res, "images").catch(next);
    },
  );

  /** DELETE /api/uploads/:kind/:filename — solo del guild autorizado (TEN-01). */
  router.delete("/:kind/:filename", (req, res, next) => {
    const kind = req.params.kind;
    if (kind !== "backgrounds" && kind !== "images") {
      next(new HttpError("Unknown upload kind.", 400, "INVALID_UPLOAD_KIND"));
      return;
    }
    const guildId = guildIdOf(req);
    deleteUploadedAsset(kind, guildId, req.params.filename).then(
      (deleted) => {
        if (!deleted) {
          next(new HttpError("Upload not found.", 404, "UPLOAD_NOT_FOUND"));
          return;
        }
        res.json({ ok: true });
      },
      (error: unknown) => next(error),
    );
  });

  return router;
}
