import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";
import { guildIdOf } from "#core/http/guildContext.js";
import { idParams } from "#core/http/schemas.js";
import { defineRoute } from "#core/http/validate.js";
import { getTenantUploadDir } from "#lib/dataPaths.js";
import { sniffImageFile } from "#lib/imageMagic.js";
import { assertUploadQuota, recordUploadedAsset } from "#lib/uploadedAssets.js";
import {
  deleteEmbedTemplate,
  EmbedTemplateError,
  getEmbedTemplate,
  listEmbedTemplates,
  saveEmbedTemplate,
} from "../templates/service.js";
import { saveEmbedTemplateSchema } from "./schema.js";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

function safeImageExt(originalname: string): string {
  const ext = path.extname(originalname).toLowerCase();
  if (ext === ".png" || ext === ".webp" || ext === ".gif") return ext;
  if (ext === ".jpg" || ext === ".jpeg") return ".jpg";
  return ".png";
}

const templateUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        cb(null, getTenantUploadDir("templates", guildIdOf(req)));
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
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Only PNG, JPG, WEBP or GIF (max 5MB)."));
      return;
    }
    cb(null, true);
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "authorIcon", maxCount: 1 },
  { name: "footerIcon", maxCount: 1 },
]);

/** TEN-01: cuota antes de que multer escriba nada (ver core/http/uploads.ts). */
function enforceTemplateUploadQuota(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const guildId = guildIdOf(req);
  const incoming = Number(req.headers["content-length"] ?? 0);
  assertUploadQuota(guildId, incoming).then(
    () => next(),
    (error: unknown) => next(error),
  );
}

function publicTemplatePath(guildId: string, filename: string): string {
  return `/uploads/templates/${guildId}/${filename}`;
}

/** Sniffea cada archivo subido; devuelve su MIME real por campo. Borra y lanza si alguno no es imagen. */
function assertSniffedTemplateFiles(
  files: Record<string, Express.Multer.File[]> | undefined,
): Map<Express.Multer.File, string> {
  const uploaded = [
    ...(files?.image ?? []),
    ...(files?.thumbnail ?? []),
    ...(files?.authorIcon ?? []),
    ...(files?.footerIcon ?? []),
  ];
  const mimeByFile = new Map<Express.Multer.File, string>();
  for (const file of uploaded) {
    const sniffed = sniffImageFile(file.path);
    if (!sniffed) {
      fs.unlink(file.path, () => undefined);
      throw new EmbedTemplateError(
        "The file is not a valid PNG, JPG, WEBP or GIF image.",
        400,
        "INVALID_IMAGE_CONTENT",
      );
    }
    mimeByFile.set(file, sniffed);
  }
  return mimeByFile;
}

export function embedTemplateRoutes(): Router {
  const router = Router();

  router.get(
    "/",
    defineRoute({}, async (req, res) => {
      res.json(await listEmbedTemplates(guildIdOf(req)));
    }),
  );

  router.post(
    "/",
    enforceTemplateUploadQuota,
    templateUpload,
    defineRoute({ body: saveEmbedTemplateSchema }, async (req, res, valid) => {
      const guildId = guildIdOf(req);
      const ownerId = req.panelSession?.userId ?? "unknown";
      const files = req.files as
        | Record<string, Express.Multer.File[]>
        | undefined;
      const mimeByFile = assertSniffedTemplateFiles(files);

      const uploadedPaths: {
        imageUrl?: string;
        thumbnailUrl?: string;
        authorIconUrl?: string;
        footerIconUrl?: string;
      } = {};
      const image = files?.image?.[0];
      const thumbnail = files?.thumbnail?.[0];
      const authorIcon = files?.authorIcon?.[0];
      const footerIcon = files?.footerIcon?.[0];
      if (image)
        uploadedPaths.imageUrl = publicTemplatePath(guildId, image.filename);
      if (thumbnail) {
        uploadedPaths.thumbnailUrl = publicTemplatePath(
          guildId,
          thumbnail.filename,
        );
      }
      if (authorIcon) {
        uploadedPaths.authorIconUrl = publicTemplatePath(
          guildId,
          authorIcon.filename,
        );
      }
      if (footerIcon) {
        uploadedPaths.footerIconUrl = publicTemplatePath(
          guildId,
          footerIcon.filename,
        );
      }

      for (const [file, mimeType] of mimeByFile) {
        await recordUploadedAsset({
          guildId,
          ownerId,
          kind: "templates",
          filename: file.filename,
          mimeType,
          sizeBytes: file.size,
          filePath: file.path,
        });
      }

      res.json(
        await saveEmbedTemplate({ ...valid.body, guildId }, uploadedPaths),
      );
    }),
  );

  router.get(
    "/:id",
    defineRoute({ params: idParams }, async (req, res, valid) => {
      res.json(await getEmbedTemplate(valid.params.id, guildIdOf(req)));
    }),
  );

  router.delete(
    "/:id",
    defineRoute({ params: idParams }, async (req, res, valid) => {
      res.json(
        await deleteEmbedTemplate(String(valid.params.id), guildIdOf(req)),
      );
    }),
  );

  return router;
}
