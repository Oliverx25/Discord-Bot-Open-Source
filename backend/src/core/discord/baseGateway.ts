import type { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import { cache } from "#core/cache/store.js";
import { env } from "#core/env.js";
import { safeImageFetch } from "#core/http/safeImageFetch.js";
import {
  type AutoModRuleInput,
  BotGatewayError,
  type ChannelMessageBrief,
  type ChannelSummary,
  type CreateChannelInput,
  type CreateRoleInput,
  type EditMessageResult,
  type OutgoingMessage,
  type PublishedEmbedMedia,
  type RoleDetail,
  type SentMessageResult,
  type UpdateRoleInput,
} from "./botGateway.js";
import { discordCacheKey } from "./discordCache.js";
import { getDiscordRest } from "./rest.js";

/**
 * Invalida claves de la caché read-through de `RestGateway`. Fire-and-forget:
 * un fallo de caché no debe romper la escritura. `RedisStore.del` propaga la
 * invalidación por pub/sub a las demás réplicas `api`.
 */
function bustDiscordCache(...keys: string[]): void {
  for (const key of keys) {
    void cache()
      .del(key)
      .catch(() => undefined);
  }
}

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

/**
 * SEC-02: `avatar` puede venir de `serverAvatarUrl` (panel, string http(s)
 * arbitraria) — nunca `fetch()` directo. `safeImageFetch` bloquea SSRF,
 * limita tamaño/redirects y ya valida magic bytes reales.
 */
async function toImageDataUri(avatar: Buffer | string): Promise<string> {
  if (typeof avatar === "string") {
    const { buffer, contentType } = await safeImageFetch(avatar, {
      maxBytes: 8 * 1024 * 1024,
      timeoutMs: 12_000,
    });
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }
  const mime =
    MAGIC.find(([, sig]) => sig.every((b, i) => avatar[i] === b))?.[0] ??
    "image/png";
  return `data:${mime};base64,${avatar.toString("base64")}`;
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
  private cachedBotUserId: string | null = null;

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
    guildId: string,
    channelId: string,
    reason?: string,
  ): Promise<void> {
    await this.restClient()
      .delete(Routes.channel(channelId), { reason })
      .catch(() => undefined);
    bustDiscordCache(
      discordCacheKey.channel(channelId),
      discordCacheKey.channels(guildId),
    );
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
    bustDiscordCache(discordCacheKey.channel(channelId));
  }

  async deleteChannelOverwrite(
    channelId: string,
    overwriteId: string,
    reason?: string,
  ): Promise<void> {
    await this.restClient()
      .delete(Routes.channelPermission(channelId, overwriteId), { reason })
      .catch(() => undefined);
    bustDiscordCache(discordCacheKey.channel(channelId));
  }

  async createChannel(
    guildId: string,
    input: CreateChannelInput,
  ): Promise<ChannelSummary> {
    const created = (await this.restClient().post(
      Routes.guildChannels(guildId),
      {
        body: {
          name: input.name,
          type: input.type,
          parent_id: input.parentId ?? undefined,
          topic: input.topic,
          permission_overwrites: input.permissionOverwrites?.map((o) => ({
            id: o.id,
            type: o.type,
            allow: o.allow ?? "0",
            deny: o.deny ?? "0",
          })),
        },
        reason: input.reason,
      },
    )) as {
      id: string;
      name?: string | null;
      type: number;
      parent_id?: string | null;
      position?: number;
    };
    bustDiscordCache(discordCacheKey.channels(guildId));
    return {
      id: created.id,
      name: created.name ?? input.name,
      type: created.type,
      parentId: created.parent_id ?? null,
      position: created.position ?? 0,
    };
  }

  async pinMessage(
    channelId: string,
    messageId: string,
    reason?: string,
  ): Promise<void> {
    await this.restClient()
      .put(Routes.channelPin(channelId, messageId), { reason })
      .catch(() => undefined);
  }

  // ─────────── Lecturas compartidas (REST; subclases con Client pueden override) ───────────

  async getBotUserId(): Promise<string> {
    if (!this.cachedBotUserId) {
      const me = (await this.restClient().get(Routes.user("@me"))) as {
        id: string;
      };
      this.cachedBotUserId = me.id;
    }
    return this.cachedBotUserId;
  }

  async getBotGuildIds(): Promise<string[]> {
    const ids: string[] = [];
    let after: string | undefined;
    for (let page = 0; page < 100; page++) {
      const query = new URLSearchParams({ limit: "200" });
      if (after) query.set("after", after);
      const batch = (await this.restClient().get(Routes.userGuilds(), {
        query,
      })) as { id: string }[];
      for (const guild of batch) ids.push(guild.id);
      if (batch.length < 200) break;
      after = batch[batch.length - 1]!.id;
    }
    return ids;
  }

  async listChannelMessages(
    channelId: string,
    opts: { limit?: number; before?: string } = {},
  ): Promise<ChannelMessageBrief[]> {
    const query = new URLSearchParams({
      limit: String(Math.max(1, Math.min(100, opts.limit ?? 50))),
    });
    if (opts.before) query.set("before", opts.before);
    const msgs = (await this.restClient().get(
      Routes.channelMessages(channelId),
      { query },
    )) as {
      id: string;
      content?: string;
      timestamp: string;
      author: {
        id: string;
        username: string;
        discriminator?: string;
        bot?: boolean;
      };
      attachments?: unknown[];
      components?: unknown[];
      pinned?: boolean;
    }[];
    return msgs.map((m) => ({
      id: m.id,
      authorId: m.author.id,
      authorTag:
        m.author.discriminator && m.author.discriminator !== "0"
          ? `${m.author.username}#${m.author.discriminator}`
          : m.author.username,
      authorIsBot: Boolean(m.author.bot),
      content: m.content ?? "",
      createdAt: m.timestamp,
      attachmentCount: m.attachments?.length ?? 0,
      hasComponents: (m.components?.length ?? 0) > 0,
      pinned: Boolean(m.pinned),
    }));
  }

  async bulkDeleteMessageIds(
    channelId: string,
    messageIds: string[],
    reason?: string,
  ): Promise<void> {
    const ids = [...new Set(messageIds)].slice(0, 100);
    if (ids.length === 0) return;
    if (ids.length === 1) {
      await this.restClient()
        .delete(Routes.channelMessage(channelId, ids[0]!), { reason })
        .catch(() => undefined);
      return;
    }
    await this.restClient()
      .post(Routes.channelBulkDelete(channelId), {
        body: { messages: ids },
        reason,
      })
      .catch(() => undefined);
  }

  async listActiveThreads(
    guildId: string,
  ): Promise<{ id: string; parentId: string | null; type: number }[]> {
    const res = (await this.restClient().get(
      Routes.guildActiveThreads(guildId),
    )) as {
      threads: { id: string; parent_id?: string | null; type: number }[];
    };
    return (res.threads ?? []).map((t) => ({
      id: t.id,
      parentId: t.parent_id ?? null,
      type: t.type,
    }));
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
    bustDiscordCache(discordCacheKey.channel(channelId));
  }

  async setChannelSlowmode(
    _guildId: string,
    channelId: string,
    seconds: number,
    reason?: string,
  ): Promise<void> {
    await this.restClient().patch(Routes.channel(channelId), {
      body: {
        rate_limit_per_user: Math.max(0, Math.min(21600, Math.round(seconds))),
      },
      reason,
    });
    bustDiscordCache(discordCacheKey.channel(channelId));
  }

  async createInvite(
    channelId: string,
    opts: {
      maxUses?: number;
      maxAgeSeconds?: number;
      unique?: boolean;
      reason?: string;
    } = {},
  ): Promise<string | null> {
    try {
      const invite = (await this.restClient().post(
        Routes.channelInvites(channelId),
        {
          body: {
            max_uses: opts.maxUses ?? 0,
            max_age: opts.maxAgeSeconds ?? 86_400,
            unique: opts.unique ?? true,
          },
          reason: opts.reason,
        },
      )) as { code: string };
      return `https://discord.gg/${invite.code}`;
    } catch {
      return null;
    }
  }

  // ─────────── Moderación de miembros ───────────

  async banMember(
    guildId: string,
    userId: string,
    opts: { reason?: string; deleteMessageSeconds?: number } = {},
  ): Promise<void> {
    await this.restClient().put(Routes.guildBan(guildId, userId), {
      body: { delete_message_seconds: opts.deleteMessageSeconds ?? 0 },
      reason: opts.reason,
    });
  }

  async unbanMember(
    guildId: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    await this.restClient().delete(Routes.guildBan(guildId, userId), {
      reason,
    });
  }

  async kickMember(
    guildId: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    await this.restClient().delete(Routes.guildMember(guildId, userId), {
      reason,
    });
  }

  async addMemberRole(
    guildId: string,
    userId: string,
    roleId: string,
    reason?: string,
  ): Promise<void> {
    await this.restClient().put(
      Routes.guildMemberRole(guildId, userId, roleId),
      { reason },
    );
  }

  async removeMemberRole(
    guildId: string,
    userId: string,
    roleId: string,
    reason?: string,
  ): Promise<void> {
    await this.restClient().delete(
      Routes.guildMemberRole(guildId, userId, roleId),
      { reason },
    );
  }

  async timeoutMember(
    guildId: string,
    userId: string,
    until: string | null,
    reason?: string,
  ): Promise<void> {
    await this.restClient().patch(Routes.guildMember(guildId, userId), {
      body: { communication_disabled_until: until },
      reason,
    });
  }

  async bulkDeleteMessages(
    channelId: string,
    opts: { limit: number; filterUserId?: string | null },
  ): Promise<number> {
    const limit = Math.max(1, Math.min(100, Math.round(opts.limit)));
    const fetched = (await this.restClient().get(
      Routes.channelMessages(channelId),
      { query: new URLSearchParams({ limit: "100" }) },
    )) as { id: string; author?: { id?: string }; timestamp?: string }[];
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const ids = fetched
      .filter((m) => !m.timestamp || Date.parse(m.timestamp) > twoWeeksAgo)
      .filter((m) => !opts.filterUserId || m.author?.id === opts.filterUserId)
      .map((m) => m.id)
      .slice(0, limit);
    if (ids.length === 0) return 0;
    if (ids.length === 1) {
      await this.restClient().delete(Routes.channelMessage(channelId, ids[0]!));
      return 1;
    }
    await this.restClient().post(Routes.channelBulkDelete(channelId), {
      body: { messages: ids },
    });
    return ids.length;
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
    bustDiscordCache(discordCacheKey.roles(guildId));
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
    bustDiscordCache(discordCacheKey.roles(guildId));
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
    bustDiscordCache(discordCacheKey.roles(guildId));
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
    bustDiscordCache(discordCacheKey.roles(guildId));
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
    bustDiscordCache(discordCacheKey.botProfile(guildId));
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
    bustDiscordCache(discordCacheKey.botProfile(guildId));
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
