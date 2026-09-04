import type { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import { env } from "#core/env.js";
import {
  type AutoModRuleInput,
  BotGatewayError,
  type CreateRoleInput,
  type EditMessageResult,
  type OutgoingMessage,
  type PublishedEmbedMedia,
  type RoleDetail,
  type SentMessageResult,
  type UpdateRoleInput,
} from "./botGateway.js";
import { getDiscordRest } from "./rest.js";

interface DiscordWebhook {
  id: string;
  name: string | null;
  token?: string;
}

interface APIMessageLite {
  id: string;
  channel_id: string;
  embeds?: {
    author?: { icon_url?: string };
    thumbnail?: { url?: string };
    image?: { url?: string };
    footer?: { icon_url?: string };
  }[];
}

interface APIRoleLite {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
  hoist: boolean;
  mentionable: boolean;
}

const UNKNOWN_MESSAGE = 10008;

function hexColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function toRoleDetail(role: APIRoleLite): RoleDetail {
  return {
    id: role.id,
    name: role.name,
    color: role.color,
    hexColor: hexColor(role.color),
    position: role.position,
    managed: role.managed,
    hoist: role.hoist,
    mentionable: role.mentionable,
    permissions: BigInt(role.permissions),
  };
}

function embedMediaOf(
  message: APIMessageLite,
): PublishedEmbedMedia | undefined {
  const embed = message.embeds?.[0];
  if (!embed) return undefined;
  return {
    authorIconUrl: embed.author?.icon_url,
    thumbnailUrl: embed.thumbnail?.url,
    imageUrl: embed.image?.url,
    footerIconUrl: embed.footer?.icon_url,
  };
}

function autoModBody(rule: AutoModRuleInput): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (rule.keywordFilter !== undefined)
    meta.keyword_filter = rule.keywordFilter;
  if (rule.regexPatterns !== undefined)
    meta.regex_patterns = rule.regexPatterns;
  if (rule.mentionTotalLimit !== undefined) {
    meta.mention_total_limit = rule.mentionTotalLimit;
  }
  if (rule.mentionRaidProtectionEnabled !== undefined) {
    meta.mention_raid_protection_enabled = rule.mentionRaidProtectionEnabled;
  }
  return {
    name: rule.name,
    enabled: rule.enabled,
    event_type: rule.eventType,
    trigger_metadata: meta,
    actions: rule.actions.map((action) => ({
      type: action.type,
      metadata: action.customMessage
        ? { custom_message: action.customMessage }
        : undefined,
    })),
    exempt_roles: rule.exemptRoles ?? [],
    exempt_channels: rule.exemptChannels ?? [],
  };
}

function isDiscordCode(error: unknown, code: number): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; rawError?: { code?: unknown } };
  return e.code === code || e.rawError?.code === code;
}

const MAGIC: [string, number[]][] = [
  ["image/png", [0x89, 0x50, 0x4e, 0x47]],
  ["image/gif", [0x47, 0x49, 0x46]],
  ["image/webp", [0x52, 0x49, 0x46, 0x46]],
  ["image/jpeg", [0xff, 0xd8, 0xff]],
];

async function toImageDataUri(avatar: Buffer | string): Promise<string> {
  let buf: Buffer;
  if (typeof avatar === "string") {
    const res = await fetch(avatar);
    buf = Buffer.from(await res.arrayBuffer());
  } else {
    buf = avatar;
  }
  const mime =
    MAGIC.find(([, sig]) => sig.every((b, i) => buf[i] === b))?.[0] ??
    "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/**
 * Base común de los adaptadores de `BotGateway`.
 *
 * Aquí viven (a partir de la wave 15) las **escrituras** — que son la misma
 * llamada REST por token tanto si hay gateway vivo (`LocalClientGateway`) como
 * si no (`RestGateway`). Se implementan **una sola vez**. Las lecturas las
 * resuelve cada subclase a su manera (caché del Client / REST + Redis).
 */
export abstract class BaseGateway {
  private rest: REST | null = null;

  /** Cliente REST por token. Lanza si no hay `DISCORD_TOKEN`. */
  protected restClient(): REST {
    if (!this.rest) {
      const token = env().DISCORD_TOKEN?.trim();
      if (!token) {
        throw new BotGatewayError(
          "No Discord token configured for REST operations.",
          503,
          "NO_DISCORD_TOKEN",
        );
      }
      this.rest = getDiscordRest(token);
    }
    return this.rest;
  }

  // ─────────── Canales ───────────

  async deleteChannel(
    _guildId: string,
    channelId: string,
    reason?: string,
  ): Promise<void> {
    await this.restClient()
      .delete(Routes.channel(channelId), { reason })
      .catch(() => undefined);
  }

  async putChannelOverwrite(
    channelId: string,
    overwriteId: string,
    input: { type: number; allow: string; deny: string; reason?: string },
  ): Promise<void> {
    await this.restClient().put(
      Routes.channelPermission(channelId, overwriteId),
      {
        body: { type: input.type, allow: input.allow, deny: input.deny },
        reason: input.reason,
      },
    );
  }

  async setChannelOverwrites(
    channelId: string,
    overwrites: { id: string; type: number; allow: string; deny: string }[],
    reason?: string,
  ): Promise<void> {
    await this.restClient().patch(Routes.channel(channelId), {
      body: { permission_overwrites: overwrites },
      reason,
    });
  }

  // ─────────── Mensajes ───────────

  async sendMessage(
    _guildId: string,
    channelId: string,
    message: OutgoingMessage,
  ): Promise<SentMessageResult> {
    const sent = (await this.restClient().post(
      Routes.channelMessages(channelId),
      {
        body: {
          content: message.content,
          embeds: message.embeds,
          components: message.components,
          allowed_mentions: message.allowedMentions,
        },
        files: message.files?.map((f) => ({ name: f.name, data: f.data })),
      },
    )) as APIMessageLite;
    return {
      messageId: sent.id,
      channelId: sent.channel_id,
      embedMedia: embedMediaOf(sent),
    };
  }

  async editMessage(
    _guildId: string,
    channelId: string,
    messageId: string,
    message: OutgoingMessage,
  ): Promise<EditMessageResult> {
    try {
      const edited = (await this.restClient().patch(
        Routes.channelMessage(channelId, messageId),
        {
          body: {
            content: message.content ?? null,
            embeds: message.embeds ?? [],
            components: message.components ?? [],
            allowed_mentions: message.allowedMentions,
          },
          files: message.files?.map((f) => ({ name: f.name, data: f.data })),
        },
      )) as APIMessageLite;
      return { orphaned: false, embedMedia: embedMediaOf(edited) };
    } catch (error) {
      if (isDiscordCode(error, UNKNOWN_MESSAGE)) return { orphaned: true };
      throw error;
    }
  }

  async deleteMessage(
    _guildId: string,
    channelId: string,
    messageId: string,
  ): Promise<{ orphaned: boolean }> {
    try {
      await this.restClient().delete(
        Routes.channelMessage(channelId, messageId),
      );
      return { orphaned: false };
    } catch (error) {
      if (isDiscordCode(error, UNKNOWN_MESSAGE)) return { orphaned: true };
      throw error;
    }
  }

  async sendDirectMessage(
    userId: string,
    message: OutgoingMessage,
  ): Promise<{ sent: boolean }> {
    try {
      const dm = (await this.restClient().post(Routes.userChannels(), {
        body: { recipient_id: userId },
      })) as { id: string };
      await this.restClient().post(Routes.channelMessages(dm.id), {
        body: {
          content: message.content,
          embeds: message.embeds,
          components: message.components,
          allowed_mentions: message.allowedMentions,
        },
      });
      return { sent: true };
    } catch {
      return { sent: false };
    }
  }

  // ─────────── Roles ───────────

  async createRole(
    guildId: string,
    input: CreateRoleInput,
  ): Promise<RoleDetail> {
    const role = (await this.restClient().post(Routes.guildRoles(guildId), {
      body: {
        name: input.name,
        color: input.color,
        permissions: input.permissions.toString(),
        hoist: input.hoist,
        mentionable: input.mentionable,
      },
      reason: input.reason,
    })) as APIRoleLite;
    if (input.position > 0) {
      await this.restClient()
        .patch(Routes.guildRoles(guildId), {
          body: [{ id: role.id, position: input.position }],
          reason: input.reason,
        })
        .catch(() => undefined);
    }
    return toRoleDetail(role);
  }

  async updateRole(
    guildId: string,
    roleId: string,
    patch: UpdateRoleInput,
  ): Promise<RoleDetail> {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.color !== undefined) body.color = patch.color;
    if (patch.permissions !== undefined) {
      body.permissions = patch.permissions.toString();
    }
    if (patch.hoist !== undefined) body.hoist = patch.hoist;
    if (patch.mentionable !== undefined) body.mentionable = patch.mentionable;
    const role = (await this.restClient().patch(
      Routes.guildRole(guildId, roleId),
      { body, reason: patch.reason },
    )) as APIRoleLite;
    return toRoleDetail(role);
  }

  async deleteRole(
    guildId: string,
    roleId: string,
    reason?: string,
  ): Promise<void> {
    await this.restClient().delete(Routes.guildRole(guildId, roleId), {
      reason,
    });
  }

  async setRolePositions(
    guildId: string,
    positions: { roleId: string; position: number }[],
    reason?: string,
  ): Promise<RoleDetail[]> {
    const roles = (await this.restClient().patch(Routes.guildRoles(guildId), {
      body: positions.map((p) => ({ id: p.roleId, position: p.position })),
      reason,
    })) as APIRoleLite[];
    return roles
      .filter((r) => r.id !== guildId)
      .map(toRoleDetail)
      .sort((a, b) => b.position - a.position);
  }

  // ─────────── Perfil del bot ───────────

  async setBotGuildNickname(
    guildId: string,
    nickname: string | null,
  ): Promise<void> {
    await this.restClient().patch(Routes.guildMember(guildId, "@me"), {
      body: { nick: nickname },
    });
  }

  async setBotGuildAvatar(
    guildId: string,
    avatar: Buffer | string | null,
  ): Promise<void> {
    const body =
      avatar === null
        ? { avatar: null }
        : { avatar: await toImageDataUri(avatar) };
    await this.restClient().patch(Routes.guildMember(guildId, "@me"), { body });
  }

  // ─────────── Reacciones ───────────

  async addReaction(
    channelId: string,
    messageId: string,
    emoji: string,
  ): Promise<void> {
    await this.restClient()
      .put(
        Routes.channelMessageOwnReaction(
          channelId,
          messageId,
          encodeURIComponent(emoji),
        ),
      )
      .catch(() => undefined);
  }

  async clearReactions(channelId: string, messageId: string): Promise<void> {
    await this.restClient()
      .delete(Routes.channelMessageAllReactions(channelId, messageId))
      .catch(() => undefined);
  }

  // ─────────── AutoMod nativo ───────────

  async createAutoModRule(
    guildId: string,
    rule: AutoModRuleInput,
  ): Promise<void> {
    await this.restClient().post(Routes.guildAutoModerationRules(guildId), {
      body: { ...autoModBody(rule), trigger_type: rule.triggerType },
      reason: rule.reason,
    });
  }

  async editAutoModRule(
    guildId: string,
    ruleId: string,
    rule: AutoModRuleInput,
  ): Promise<void> {
    await this.restClient().patch(
      Routes.guildAutoModerationRule(guildId, ruleId),
      { body: autoModBody(rule), reason: rule.reason },
    );
  }

  async deleteAutoModRule(
    guildId: string,
    ruleId: string,
    reason?: string,
  ): Promise<void> {
    await this.restClient().delete(
      Routes.guildAutoModerationRule(guildId, ruleId),
      { reason },
    );
  }

  // ─────────── Webhooks ───────────

  async listChannelWebhooks(
    channelId: string,
  ): Promise<{ id: string; name: string; token: string | null }[]> {
    const hooks = (await this.restClient().get(
      Routes.channelWebhooks(channelId),
    )) as DiscordWebhook[];
    return hooks.map((hook) => ({
      id: hook.id,
      name: hook.name ?? "",
      token: hook.token ?? null,
    }));
  }

  async createChannelWebhook(
    channelId: string,
    name: string,
    reason?: string,
  ): Promise<{ id: string; token: string }> {
    const hook = (await this.restClient().post(
      Routes.channelWebhooks(channelId),
      { body: { name }, reason },
    )) as DiscordWebhook;
    return { id: hook.id, token: hook.token ?? "" };
  }

  async executeWebhook(
    webhookId: string,
    token: string,
    payload: OutgoingMessage & { username?: string; avatarUrl?: string },
  ): Promise<{ messageId: string }> {
    try {
      const message = (await this.restClient().post(
        `${Routes.webhook(webhookId, token)}?wait=true`,
        {
          body: {
            content: payload.content,
            embeds: payload.embeds,
            components: payload.components,
            username: payload.username,
            avatar_url: payload.avatarUrl,
            allowed_mentions: payload.allowedMentions,
          },
          auth: false,
        },
      )) as { id: string };
      return { messageId: message.id };
    } catch (error) {
      if (isUnknownWebhookError(error)) {
        throw new BotGatewayError(
          "The webhook no longer exists on Discord.",
          404,
          "UNKNOWN_WEBHOOK",
        );
      }
      throw error;
    }
  }
}

function isUnknownWebhookError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; status?: unknown; rawError?: unknown };
  if (e.code === 10015) return true;
  const raw = e.rawError as { code?: unknown } | undefined;
  return raw?.code === 10015 || e.status === 404;
}
