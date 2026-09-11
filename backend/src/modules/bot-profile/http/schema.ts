import { BOT_GUILD_NICKNAME_MAX } from "@adobos/shared";
import { z } from "zod";
import { boolish } from "#core/http/schemas.js";

export const updateBotGuildProfileSchema = z.object({
  nickname: z.string().max(BOT_GUILD_NICKNAME_MAX).nullable().optional(),
  clearNickname: boolish.optional(),
  serverAvatarUrl: z.string().nullable().optional(),
  clearServerAvatar: boolish.optional(),
  serverBannerUrl: z.string().nullable().optional(),
  clearServerBanner: boolish.optional(),
  timezone: z.string().min(1).max(64).optional(),
  locale: z.enum(["en", "es"]).optional(),
});
