import { Router } from "express";
import multer from "multer";
import type { BotGateway } from "#core/discord/botGateway.js";
import { guildIdOf } from "#core/http/guildContext.js";
import { defineRoute } from "#core/http/validate.js";
import { getGuildBotProfile, updateGuildBotProfile } from "../discord.js";
import { updateBotGuildProfileSchema } from "./schema.js";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
]);

const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Avatar: only PNG, JPG, GIF or WEBP (max 8MB)."));
      return;
    }
    cb(null, true);
  },
});

export function botProfileRoutes(gateway: BotGateway): Router {
  const router = Router();

  router.get(
    "/",
    defineRoute({}, async (req, res) => {
      res.json(await getGuildBotProfile(gateway, guildIdOf(req)));
    }),
  );

  router.post(
    "/",
    avatarUpload.fields([
      { name: "serverAvatar", maxCount: 1 },
      { name: "serverBanner", maxCount: 1 },
    ]),
    defineRoute(
      { body: updateBotGuildProfileSchema },
      async (req, res, valid) => {
        const result = await updateGuildBotProfile(gateway, {
          fields: valid.body,
          avatarBuffer: (
            req.files as Record<string, Express.Multer.File[]> | undefined
          )?.serverAvatar?.[0]?.buffer,
          bannerBuffer: (
            req.files as Record<string, Express.Multer.File[]> | undefined
          )?.serverBanner?.[0]?.buffer,
          guildId: guildIdOf(req),
        });
        res.json(result);
      },
    ),
  );

  return router;
}
