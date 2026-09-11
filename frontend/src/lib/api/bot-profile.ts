import type {
  BotGuildLocale,
  BotGuildProfileResponse,
  UpdateBotGuildProfileResponse,
} from "@adobos/shared";
import { apiFetch, readApiError, readApiErrorDetails } from "./client";

export class BotProfileApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "BotProfileApiError";
  }
}

export async function fetchBotGuildProfile(): Promise<BotGuildProfileResponse> {
  const response = await apiFetch(`/api/bot/guild-profile`);
  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        `Couldn't load the server profile (${response.status})`,
      ),
    );
  }
  return response.json() as Promise<BotGuildProfileResponse>;
}

/** @deprecated Preferir fetchBotGuildProfile. */
export const fetchBotProfile = fetchBotGuildProfile;

export interface SaveBotGuildProfileInput {
  nickname?: string;
  clearNickname?: boolean;
  /** URL http(s) o `/uploads/...` (si se subió con HybridImageInput). */
  serverAvatarUrl?: string | null;
  clearServerAvatar?: boolean;
  /** Archivo multipart (alternativa a URL). */
  serverAvatarFile?: File | null;
  serverBannerUrl?: string | null;
  clearServerBanner?: boolean;
  serverBannerFile?: File | null;
  timezone?: string;
  locale?: BotGuildLocale;
}

export async function saveBotGuildProfile(
  input: SaveBotGuildProfileInput,
): Promise<UpdateBotGuildProfileResponse> {
  const body = new FormData();
  if (input.nickname !== undefined) body.set("nickname", input.nickname);
  if (input.clearNickname) body.set("clearNickname", "true");
  if (input.clearServerAvatar) body.set("clearServerAvatar", "true");
  if (input.serverAvatarUrl?.trim()) {
    body.set("serverAvatarUrl", input.serverAvatarUrl.trim());
  }
  if (input.serverAvatarFile) {
    body.set("serverAvatar", input.serverAvatarFile);
  }
  if (input.clearServerBanner) body.set("clearServerBanner", "true");
  if (input.serverBannerUrl?.trim())
    body.set("serverBannerUrl", input.serverBannerUrl.trim());
  if (input.serverBannerFile) body.set("serverBanner", input.serverBannerFile);
  if (input.timezone) body.set("timezone", input.timezone);
  if (input.locale) body.set("locale", input.locale);

  const response = await apiFetch(`/api/bot/guild-profile`, {
    method: "POST",
    body,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const details = await readApiErrorDetails(
      response,
      `Couldn't save server profile (${response.status})`,
    );
    throw new BotProfileApiError(details.message, details.code, details.field);
  }

  return response.json() as Promise<UpdateBotGuildProfileResponse>;
}

/** @deprecated Preferir saveBotGuildProfile. */
export type SaveBotProfileInput = SaveBotGuildProfileInput;
/** @deprecated Preferir saveBotGuildProfile. */
export const saveBotProfile = saveBotGuildProfile;
