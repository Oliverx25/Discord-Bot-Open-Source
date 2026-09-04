import {
  type Client,
  DiscordAPIError,
  type Guild,
  type GuildMember,
  PermissionFlagsBits,
  type Role,
  type User,
} from "discord.js";
import { resolveMembersBatch, safeAvatarOptions } from "#lib/discordMember.js";
import { BaseGateway } from "./baseGateway.js";
import {
  type AuditLogPage,
  type AuditLogUserRef,
  type AutoModRuleSummary,
  type BotGateway,
  BotGatewayError,
  type BotProfileSummary,
  type BotRoleAdminContext,
  type ChannelDetail,
  type ChannelMessageBrief,
  type ChannelOverwrite,
  type ChannelSummary,
  type EmojiSummary,
  type FetchedMessage,
  type GuildBanEntry,
  type GuildSummary,
  type MemberActionability,
  type MemberInfo,
  type MemberProfile,
  type RoleDetail,
  type RoleSummary,
  type StickerSummary,
  type UserInfo,
} from "./botGateway.js";

function toMemberInfo(member: GuildMember): MemberInfo {
  return {
    userId: member.id,
    username: member.user.username,
    globalName: member.user.globalName,
    displayName: member.displayName,
    avatarUrl: member.displayAvatarURL(safeAvatarOptions(256)),
    bot: member.user.bot,
    joinedAt: member.joinedAt?.toISOString() ?? null,
    timedOutUntil: member.communicationDisabledUntil?.toISOString() ?? null,
    roles: member.roles.cache
      .filter((role) => role.id !== member.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((role) => ({
        id: role.id,
        name: role.name,
        hexColor: role.hexColor,
      })),
  };
}

const AVATAR_OPTS = {
  size: 256,
  extension: "png",
  forceStatic: true,
} as const;

function toRoleDetail(role: Role): RoleDetail {
  return {
    id: role.id,
    name: role.name,
    color: role.color,
    hexColor: role.hexColor,
    position: role.position,
    managed: role.managed,
    hoist: role.hoist,
    mentionable: role.mentionable,
    permissions: role.permissions.bitfield,
  };
}

/**
 * Adaptador de `BotGateway` sobre el `Client` vivo de discord.js.
 * Lo usan los roles `all` y `gateway`, que sí tienen gateway conectado.
 * Comportamiento idéntico al acceso directo previo (`bot.guilds.cache`…).
 */
export class LocalClientGateway extends BaseGateway implements BotGateway {
  constructor(private readonly client: Client) {
    super();
  }

  isReady(): boolean {
    return this.client.isReady();
  }

  async getBotGuildIds(): Promise<string[]> {
    return [...this.client.guilds.cache.keys()];
  }

  private guild(guildId: string): Guild | null {
    return this.client.guilds.cache.get(guildId) ?? null;
  }

  async getGuild(guildId: string): Promise<GuildSummary | null> {
    const guild = this.guild(guildId);
    if (!guild) return null;
    return {
      id: guild.id,
      name: guild.name,
      iconUrl: guild.iconURL({ size: 256 }),
      boosterRoleId: guild.roles.premiumSubscriberRole?.id ?? null,
    };
  }

  async listChannels(guildId: string): Promise<ChannelSummary[]> {
    const guild = this.guild(guildId);
    if (!guild) return [];
    if (guild.channels.cache.size === 0) {
      await guild.channels.fetch().catch(() => null);
    }
    return [...guild.channels.cache.values()]
      .filter((channel): channel is NonNullable<typeof channel> =>
        Boolean(channel),
      )
      .map((channel) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parentId: "parentId" in channel ? channel.parentId : null,
        position: "rawPosition" in channel ? channel.rawPosition : 0,
      }));
  }

  async listRoles(guildId: string): Promise<RoleSummary[]> {
    const guild = this.guild(guildId);
    if (!guild) return [];
    if (guild.roles.cache.size === 0) {
      await guild.roles.fetch().catch(() => null);
    }
    return [...guild.roles.cache.values()].map((role) => ({
      id: role.id,
      name: role.name,
      color: role.color,
      hexColor: role.hexColor,
      position: role.position,
      managed: role.managed,
    }));
  }

  async listEmojis(guildId: string): Promise<EmojiSummary[]> {
    const guild = this.guild(guildId);
    if (!guild) return [];
    if (guild.emojis.cache.size === 0) {
      await guild.emojis.fetch().catch(() => null);
    }
    return [...guild.emojis.cache.values()]
      .filter((emoji) => Boolean(emoji.name && emoji.id))
      .map((emoji) => ({
        id: emoji.id,
        name: emoji.name ?? "emoji",
        animated: Boolean(emoji.animated),
        url: emoji.imageURL({ size: 64 }) ?? emoji.url,
      }));
  }

  async listStickers(guildId: string): Promise<StickerSummary[]> {
    const guild = this.guild(guildId);
    if (!guild) return [];
    if (guild.stickers.cache.size === 0) {
      await guild.stickers.fetch().catch(() => null);
    }
    return [...guild.stickers.cache.values()].map((sticker) => ({
      id: sticker.id,
      name: sticker.name,
      description: sticker.description,
      format: String(sticker.format),
      url: sticker.url,
    }));
  }

  async getChannel(
    guildId: string,
    channelId: string,
  ): Promise<ChannelSummary | null> {
    const guild = this.guild(guildId);
    if (!guild) return null;
    const channel =
      guild.channels.cache.get(channelId) ??
      (await guild.channels.fetch(channelId).catch(() => null));
    if (!channel || channel.guildId !== guildId) return null;
    return {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      parentId: "parentId" in channel ? channel.parentId : null,
      position: "rawPosition" in channel ? channel.rawPosition : 0,
    };
  }

  async resolveMembers(
    guildId: string,
    userIds: string[],
  ): Promise<Map<string, MemberProfile>> {
    return resolveMembersBatch(this.guild(guildId), this.client, userIds);
  }

  async listMembers(guildId: string): Promise<MemberInfo[]> {
    const guild = this.guild(guildId);
    if (!guild) return [];
    await guild.members.fetch().catch(() => null);
    return [...guild.members.cache.values()].map(toMemberInfo);
  }

  async getMember(guildId: string, userId: string): Promise<MemberInfo | null> {
    const guild = this.guild(guildId);
    if (!guild) return null;
    const member =
      guild.members.cache.get(userId) ??
      (await guild.members.fetch(userId).catch(() => null));
    return member ? toMemberInfo(member) : null;
  }

  async getUser(userId: string): Promise<UserInfo | null> {
    const user = await this.client.users.fetch(userId).catch(() => null);
    if (!user) return null;
    return {
      userId: user.id,
      username: user.username,
      globalName: user.globalName,
      displayName: user.globalName || user.username,
      avatarUrl: user.displayAvatarURL(safeAvatarOptions(256)),
    };
  }

  async listBans(guildId: string): Promise<GuildBanEntry[]> {
    const guild = this.guild(guildId);
    if (!guild) return [];
    const bans = await guild.bans.fetch();
    return [...bans.values()].map((ban) => ({
      userId: ban.user.id,
      username: ban.user.username,
      globalName: ban.user.globalName,
      displayName: ban.user.globalName || ban.user.username,
      avatarUrl: ban.user.displayAvatarURL(safeAvatarOptions(256)),
      reason: ban.reason?.trim() || null,
    }));
  }

  async getChannelDetail(
    guildId: string,
    channelId: string,
  ): Promise<ChannelDetail | null> {
    const summary = await this.getChannel(guildId, channelId);
    if (!summary) return null;
    const guild = this.guild(guildId);
    const channel = guild?.channels.cache.get(channelId);
    return {
      ...summary,
      topic:
        channel && "topic" in channel
          ? ((channel.topic as string | null) ?? null)
          : null,
      slowmodeSeconds:
        channel && "rateLimitPerUser" in channel
          ? (channel.rateLimitPerUser ?? 0)
          : 0,
      nsfw: channel && "nsfw" in channel ? Boolean(channel.nsfw) : false,
    };
  }

  async fetchMessage(
    guildId: string,
    channelId: string,
    messageId: string,
  ): Promise<FetchedMessage> {
    const guild = this.guild(guildId);
    if (!guild) {
      throw new BotGatewayError(
        "The bot is not in that server.",
        404,
        "GUILD_NOT_FOUND",
      );
    }
    const channel = await guild.channels
      .fetch(channelId)
      .catch((error: unknown) => {
        if (error instanceof DiscordAPIError) {
          if (error.code === 10003) {
            throw new BotGatewayError(
              "The channel does not exist in this server.",
              404,
              "CHANNEL_NOT_FOUND",
            );
          }
          if (error.code === 50001 || error.code === 50013) {
            throw new BotGatewayError(
              "Missing Access: the bot can't see that channel.",
              403,
              "MISSING_ACCESS",
            );
          }
        }
        throw error;
      });
    if (!channel) {
      throw new BotGatewayError(
        "The channel does not exist in this server.",
        404,
        "CHANNEL_NOT_FOUND",
      );
    }
    if (!channel.isTextBased() || channel.isDMBased()) {
      throw new BotGatewayError(
        "The channel does not support reading messages.",
        400,
        "INVALID_CHANNEL_TYPE",
      );
    }

    const message = await channel.messages.fetch(messageId).catch(() => {
      throw new BotGatewayError(
        "The message does not exist in the selected channel.",
        404,
        "MESSAGE_NOT_FOUND",
      );
    });

    return {
      id: message.id,
      channelId: channel.id,
      content: message.content ?? "",
      embeds: message.embeds.map((embed) => ({
        title: embed.title ?? undefined,
        description: embed.description ?? undefined,
        url: embed.url ?? undefined,
        color: embed.hexColor ?? undefined,
        authorName: embed.author?.name ?? undefined,
        authorIconUrl: embed.author?.iconURL ?? undefined,
        thumbnailUrl: embed.thumbnail?.url ?? undefined,
        imageUrl: embed.image?.url ?? undefined,
        footerText: embed.footer?.text ?? undefined,
        footerIconUrl: embed.footer?.iconURL ?? undefined,
        timestamp: Boolean(embed.timestamp),
      })),
      author: {
        id: message.author.id,
        username: message.author.username,
        displayName:
          message.member?.displayName ||
          message.author.globalName ||
          message.author.username,
        avatarUrl: message.member
          ? message.member.displayAvatarURL(safeAvatarOptions(64))
          : message.author.displayAvatarURL(safeAvatarOptions(64)),
      },
      isBotAuthor: Boolean(
        this.client.user && message.author.id === this.client.user.id,
      ),
      pinned: message.pinned,
      reactions: [...message.reactions.cache.values()].map((reaction) => {
        const emoji = reaction.emoji;
        if (emoji.id) {
          return {
            emojiKey: `custom:${emoji.id}`,
            name: emoji.name,
            id: emoji.id,
            animated: Boolean(emoji.animated),
            imageUrl: emoji.imageURL({ size: 64 }),
            count: reaction.count,
          };
        }
        return {
          emojiKey: `unicode:${emoji.name ?? "?"}`,
          name: emoji.name,
          id: null,
          animated: false,
          imageUrl: null,
          count: reaction.count,
        };
      }),
    };
  }

  async getRoleAdminContext(
    guildId: string,
  ): Promise<BotRoleAdminContext | null> {
    const guild = this.guild(guildId);
    if (!guild) return null;
    await guild.roles.fetch().catch(() => null);

    const me = guild.members.me;
    const highest = me?.roles.highest;
    const isEveryone = highest ? highest.id === guild.id : true;

    return {
      guildName: guild.name,
      roles: [...guild.roles.cache.values()]
        .filter((role) => role.id !== guild.id)
        .map(toRoleDetail)
        .sort((a, b) => b.position - a.position),
      roleCount: guild.roles.cache.size,
      bot: {
        highestRoleId: isEveryone ? null : (highest?.id ?? null),
        highestPosition: highest?.position ?? 0,
        canManageRoles: Boolean(
          me?.permissions.has(PermissionFlagsBits.ManageRoles),
        ),
        roleName: isEveryone ? null : (highest?.name ?? null),
      },
    };
  }

  async fetchAuditLog(
    guildId: string,
    opts: { limit?: number; userId?: string; actionType?: number } = {},
  ): Promise<AuditLogPage> {
    const guild = this.guild(guildId);
    if (!guild) {
      throw new BotGatewayError(
        "The bot is not in that server.",
        404,
        "GUILD_NOT_FOUND",
      );
    }
    const fetchOpts: { limit: number; user?: string; type?: number } = {
      limit: Math.max(1, Math.min(100, Math.round(opts.limit ?? 100))),
    };
    if (opts.userId) fetchOpts.user = opts.userId;
    if (opts.actionType && opts.actionType >= 1) {
      fetchOpts.type = opts.actionType;
    }

    const logs = await guild
      .fetchAuditLogs(fetchOpts)
      .catch((error: unknown) => {
        if (
          error instanceof DiscordAPIError &&
          (error.code === 50013 || error.status === 403)
        ) {
          throw new BotGatewayError(
            "Missing the «View Audit Log» permission.",
            403,
            "MISSING_PERMISSIONS",
          );
        }
        throw error;
      });

    const users = new Map<string, AuditLogUserRef>();
    const addUser = (user: {
      id: string;
      username: string;
      globalName: string | null;
      avatarUrl: string;
    }): void => {
      if (users.has(user.id)) return;
      users.set(user.id, {
        id: user.id,
        username: user.username,
        globalName: user.globalName,
        displayName: user.globalName || user.username,
        avatarUrl: user.avatarUrl,
      });
    };

    const entries = [...logs.entries.values()].map((entry) => {
      if (entry.executor) {
        addUser({
          id: entry.executor.id,
          username: entry.executor.username ?? "unknown",
          globalName: entry.executor.globalName ?? null,
          avatarUrl: entry.executor.displayAvatarURL(safeAvatarOptions(64)),
        });
      }
      const target = entry.target as Partial<User> | null;
      if (
        target &&
        typeof target.username === "string" &&
        typeof target.id === "string" &&
        typeof target.displayAvatarURL === "function"
      ) {
        addUser({
          id: target.id,
          username: target.username,
          globalName: target.globalName ?? null,
          avatarUrl: target.displayAvatarURL(safeAvatarOptions(64)),
        });
      }
      return {
        id: entry.id,
        actionType: entry.action as number,
        executorId: entry.executorId ?? entry.executor?.id ?? null,
        targetId: entry.targetId ?? null,
        reason: entry.reason?.trim() || null,
        createdAt: entry.createdAt.toISOString(),
        changes: (entry.changes ?? []).map((change) => ({
          key: String(change.key),
          oldValue: change.old,
          newValue: change.new,
        })),
      };
    });

    return { entries, users: [...users.values()] };
  }

  async getMemberActionability(
    guildId: string,
    userId: string,
  ): Promise<MemberActionability | null> {
    const guild = this.guild(guildId);
    if (!guild) return null;
    const member =
      guild.members.cache.get(userId) ??
      (await guild.members.fetch(userId).catch(() => null));
    if (!member) return null;
    return {
      isBot: member.id === (guild.members.me?.id ?? this.client.user?.id),
      isOwner: member.id === guild.ownerId,
      bannable: member.bannable,
      kickable: member.kickable,
      moderatable: member.moderatable,
    };
  }

  async getBotUserId(): Promise<string> {
    return this.client.user?.id ?? "";
  }

  async listActiveThreads(
    guildId: string,
  ): Promise<{ id: string; parentId: string | null; type: number }[]> {
    const guild = this.guild(guildId);
    if (!guild) return [];
    const active = await guild.channels.fetchActiveThreads().catch(() => null);
    if (!active) return [];
    return [...active.threads.values()].map((t) => ({
      id: t.id,
      parentId: t.parentId ?? null,
      type: t.type,
    }));
  }

  async listChannelMessages(
    channelId: string,
    opts: { limit?: number; before?: string } = {},
  ): Promise<ChannelMessageBrief[]> {
    const channel = await this.client.channels
      .fetch(channelId)
      .catch(() => null);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) return [];
    const batch = await channel.messages
      .fetch({
        limit: Math.max(1, Math.min(100, opts.limit ?? 50)),
        before: opts.before,
      })
      .catch(() => null);
    if (!batch) return [];
    return [...batch.values()].map((m) => ({
      id: m.id,
      authorId: m.author.id,
      authorTag:
        m.author.discriminator && m.author.discriminator !== "0"
          ? `${m.author.username}#${m.author.discriminator}`
          : m.author.username,
      authorIsBot: m.author.bot,
      content: m.content ?? "",
      createdAt: m.createdAt.toISOString(),
      attachmentCount: m.attachments.size,
      hasComponents: m.components.length > 0,
      pinned: m.pinned,
    }));
  }

  async getChannelOverwrites(
    guildId: string,
    channelId: string,
  ): Promise<ChannelOverwrite[] | null> {
    const guild = this.guild(guildId);
    if (!guild) return null;
    const channel =
      guild.channels.cache.get(channelId) ??
      (await guild.channels.fetch(channelId).catch(() => null));
    if (
      !channel ||
      channel.guildId !== guildId ||
      !("permissionOverwrites" in channel)
    ) {
      return null;
    }
    return [...channel.permissionOverwrites.cache.values()].map(
      (overwrite) => ({
        id: overwrite.id,
        type: overwrite.type,
        allow: overwrite.allow.bitfield.toString(),
        deny: overwrite.deny.bitfield.toString(),
      }),
    );
  }

  async botHasGuildPermission(
    guildId: string,
    permission: bigint,
  ): Promise<boolean> {
    const me = this.guild(guildId)?.members.me ?? null;
    return Boolean(me?.permissions.has(permission));
  }

  async listAutoModRules(guildId: string): Promise<AutoModRuleSummary[]> {
    const guild = this.guild(guildId);
    if (!guild) return [];
    const rules = await guild.autoModerationRules.fetch();
    return [...rules.values()].map((rule) => ({
      id: rule.id,
      name: rule.name,
      enabled: rule.enabled,
      eventType: rule.eventType,
      triggerType: rule.triggerType,
    }));
  }

  private guildOrThrow(guildId: string): Guild {
    const guild = this.guild(guildId);
    if (!guild) {
      throw new BotGatewayError(
        "The bot is not in that server.",
        404,
        "GUILD_NOT_FOUND",
      );
    }
    return guild;
  }

  async getBotProfile(guildId: string): Promise<BotProfileSummary> {
    const guild = this.guildOrThrow(guildId);
    const me = await guild.members.fetchMe({ force: true });
    return {
      guildId: guild.id,
      guildName: guild.name,
      nickname: me.nickname ?? "",
      displayName: me.displayName,
      username: me.user.username,
      tag: me.user.tag,
      serverAvatarUrl: me.avatarURL(AVATAR_OPTS) ?? null,
      globalAvatarUrl: me.user.displayAvatarURL(AVATAR_OPTS),
      hasServerAvatar: Boolean(me.avatar),
    };
  }
}
