import {
  AttachmentBuilder,
  type Client,
  DiscordAPIError,
  type Embed,
  type Guild,
  type GuildMember,
  type Message,
  type MessageCreateOptions,
  type MessageEditOptions,
  PermissionFlagsBits,
  type Role,
  type SendableChannels,
} from "discord.js";
import { resolveMembersBatch, safeAvatarOptions } from "#lib/discordMember.js";
import { BaseGateway } from "./baseGateway.js";
import {
  type BotGateway,
  BotGatewayError,
  type BotProfileSummary,
  type BotRoleAdminContext,
  type ChannelDetail,
  type ChannelSummary,
  type CreateRoleInput,
  type EmojiSummary,
  type GuildBanEntry,
  type GuildSummary,
  type MemberInfo,
  type MemberProfile,
  type OutgoingMessage,
  type PublishedEmbedMedia,
  type RoleDetail,
  type RoleSummary,
  type StickerSummary,
  type UpdateRoleInput,
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

const UNKNOWN_MESSAGE = 10008;

function toFiles(
  files: OutgoingMessage["files"],
): AttachmentBuilder[] | undefined {
  if (!files?.length) return undefined;
  return files.map((f) => new AttachmentBuilder(f.data, { name: f.name }));
}

function embedMediaOf(message: Message): PublishedEmbedMedia | undefined {
  const embed: Embed | undefined = message.embeds[0];
  if (!embed) return undefined;
  return {
    authorIconUrl: embed.author?.iconURL,
    thumbnailUrl: embed.thumbnail?.url,
    imageUrl: embed.image?.url,
    footerIconUrl: embed.footer?.iconURL,
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

  async deleteChannel(
    guildId: string,
    channelId: string,
    reason?: string,
  ): Promise<void> {
    const guild = this.guild(guildId);
    if (!guild) return;
    const channel =
      guild.channels.cache.get(channelId) ??
      (await guild.channels.fetch(channelId).catch(() => null));
    if (!channel || channel.guildId !== guildId) return;
    await channel.delete(reason).catch(() => null);
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

  private async sendableChannel(
    guildId: string,
    channelId: string,
  ): Promise<SendableChannels> {
    const guild = this.guild(guildId);
    if (!guild) {
      throw new BotGatewayError(
        "The bot is not in that server.",
        404,
        "GUILD_NOT_FOUND",
      );
    }
    const channel =
      guild.channels.cache.get(channelId) ??
      (await guild.channels.fetch(channelId).catch(() => null));
    if (!channel || channel.guildId !== guildId) {
      throw new BotGatewayError(
        "The channel is not in this server.",
        404,
        "CHANNEL_NOT_FOUND",
      );
    }
    if (!channel.isTextBased() || !("send" in channel)) {
      throw new BotGatewayError(
        "The channel does not accept messages.",
        400,
        "CHANNEL_NOT_SENDABLE",
      );
    }
    return channel as SendableChannels;
  }

  async sendMessage(
    guildId: string,
    channelId: string,
    message: OutgoingMessage,
  ): Promise<{
    messageId: string;
    channelId: string;
    embedMedia?: PublishedEmbedMedia;
  }> {
    const channel = await this.sendableChannel(guildId, channelId);
    const sent = await channel.send({
      content: message.content,
      embeds: message.embeds,
      components: message.components,
      files: toFiles(message.files),
      allowedMentions: message.allowedMentions,
    } as MessageCreateOptions);
    return {
      messageId: sent.id,
      channelId: sent.channelId,
      embedMedia: embedMediaOf(sent),
    };
  }

  async editMessage(
    guildId: string,
    channelId: string,
    messageId: string,
    message: OutgoingMessage,
  ): Promise<{ orphaned: boolean; embedMedia?: PublishedEmbedMedia }> {
    const channel = await this.sendableChannel(guildId, channelId);
    try {
      const target = await channel.messages.fetch(messageId);
      const edited = await target.edit({
        content: message.content ?? null,
        embeds: message.embeds ?? [],
        components: message.components ?? [],
        files: toFiles(message.files),
      } as MessageEditOptions);
      return { orphaned: false, embedMedia: embedMediaOf(edited) };
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === UNKNOWN_MESSAGE) {
        return { orphaned: true };
      }
      throw error;
    }
  }

  async deleteMessage(
    guildId: string,
    channelId: string,
    messageId: string,
  ): Promise<{ orphaned: boolean }> {
    const channel = await this.sendableChannel(guildId, channelId);
    try {
      const target = await channel.messages.fetch(messageId);
      await target.delete();
      return { orphaned: false };
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === UNKNOWN_MESSAGE) {
        return { orphaned: true };
      }
      throw error;
    }
  }

  async sendDirectMessage(
    userId: string,
    message: OutgoingMessage,
  ): Promise<{ sent: boolean }> {
    try {
      const user = await this.client.users.fetch(userId);
      await user.send({
        content: message.content,
        embeds: message.embeds,
        components: message.components,
        files: toFiles(message.files),
        allowedMentions: message.allowedMentions,
      } as MessageCreateOptions);
      return { sent: true };
    } catch {
      return { sent: false };
    }
  }

  private async guildWithRoles(guildId: string): Promise<Guild> {
    const guild = this.guild(guildId);
    if (!guild) {
      throw new BotGatewayError(
        "The bot is not in that server.",
        404,
        "GUILD_NOT_FOUND",
      );
    }
    await guild.roles.fetch().catch(() => null);
    return guild;
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

  async createRole(
    guildId: string,
    input: CreateRoleInput,
  ): Promise<RoleDetail> {
    const guild = await this.guildWithRoles(guildId);
    const role = await guild.roles.create({
      name: input.name,
      colors: { primaryColor: input.color },
      permissions: input.permissions,
      hoist: input.hoist,
      mentionable: input.mentionable,
      position: input.position,
      reason: input.reason,
    });
    return toRoleDetail(role);
  }

  async updateRole(
    guildId: string,
    roleId: string,
    patch: UpdateRoleInput,
  ): Promise<RoleDetail> {
    const guild = await this.guildWithRoles(guildId);
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      throw new BotGatewayError(
        `Role not found: ${roleId}`,
        404,
        "ROLE_NOT_FOUND",
      );
    }
    const updated = await role.edit({
      name: patch.name,
      colors:
        patch.color !== undefined ? { primaryColor: patch.color } : undefined,
      permissions: patch.permissions,
      hoist: patch.hoist,
      mentionable: patch.mentionable,
      reason: patch.reason,
    });
    return toRoleDetail(updated);
  }

  async deleteRole(
    guildId: string,
    roleId: string,
    reason?: string,
  ): Promise<void> {
    const guild = await this.guildWithRoles(guildId);
    await guild.roles.delete(roleId, reason);
  }

  async setRolePositions(
    guildId: string,
    positions: { roleId: string; position: number }[],
    _reason?: string,
  ): Promise<RoleDetail[]> {
    const guild = await this.guildWithRoles(guildId);
    await guild.roles.setPositions(
      positions.map((p) => ({ role: p.roleId, position: p.position })),
    );
    await guild.roles.fetch().catch(() => null);
    return [...guild.roles.cache.values()]
      .filter((role) => role.id !== guild.id)
      .map(toRoleDetail)
      .sort((a, b) => b.position - a.position);
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

  async setBotGuildNickname(
    guildId: string,
    nickname: string | null,
  ): Promise<void> {
    const guild = this.guildOrThrow(guildId);
    const me = await guild.members.fetchMe();
    await me.setNickname(nickname);
  }

  async setBotGuildAvatar(
    guildId: string,
    avatar: Buffer | string | null,
  ): Promise<void> {
    const guild = this.guildOrThrow(guildId);
    await guild.members.editMe({ avatar });
  }
}
