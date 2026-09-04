import { CDN } from "@discordjs/rest";
import { PermissionFlagsBits, Routes } from "discord.js";
import { BaseGateway } from "./baseGateway.js";
import type {
  AuditLogPage,
  AuditLogUserRef,
  AutoModRuleSummary,
  BotGateway,
  BotProfileSummary,
  BotRoleAdminContext,
  ChannelDetail,
  ChannelOverwrite,
  ChannelSummary,
  EmojiSummary,
  FetchedMessage,
  GuildBanEntry,
  GuildSummary,
  MemberActionability,
  MemberInfo,
  MemberProfile,
  RoleDetail,
  RoleSummary,
  StickerSummary,
  UserInfo,
} from "./botGateway.js";
import { BotGatewayError } from "./botGateway.js";

const cdn = new CDN();
const AVATAR = { extension: "png", size: 256 } as const;

interface APIUser {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string;
  avatar?: string | null;
  bot?: boolean;
}
interface APIRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
  hoist: boolean;
  mentionable: boolean;
  tags?: { premium_subscriber_role?: unknown };
}
interface APIChannel {
  id: string;
  name?: string | null;
  type: number;
  parent_id?: string | null;
  position?: number;
  topic?: string | null;
  rate_limit_per_user?: number;
  nsfw?: boolean;
  guild_id?: string;
  permission_overwrites?: {
    id: string;
    type: number;
    allow: string;
    deny: string;
  }[];
}
interface APIMember {
  user: APIUser;
  nick?: string | null;
  avatar?: string | null;
  roles: string[];
  joined_at: string;
  communication_disabled_until?: string | null;
}

const DISCORD_EPOCH = 1_420_070_400_000n;

function snowflakeToISO(id: string): string {
  return new Date(Number((BigInt(id) >> 22n) + DISCORD_EPOCH)).toISOString();
}

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function isForbidden(error: unknown): boolean {
  const e = error as { status?: unknown; code?: unknown };
  return e?.status === 403 || e?.code === 50013;
}

function userAvatarUrl(user: APIUser): string {
  if (user.avatar) return cdn.avatar(user.id, user.avatar, AVATAR);
  const index = user.discriminator
    ? Number(user.discriminator) % 5
    : Number((BigInt(user.id) >> 22n) % 6n);
  return cdn.defaultAvatar(index);
}

function memberAvatarUrl(guildId: string, member: APIMember): string {
  if (member.avatar) {
    return cdn.guildMemberAvatar(
      guildId,
      member.user.id,
      member.avatar,
      AVATAR,
    );
  }
  return userAvatarUrl(member.user);
}

function displayName(user: APIUser, nick?: string | null): string {
  return nick || user.global_name || user.username;
}

function toMemberInfo(guildId: string, member: APIMember): MemberInfo {
  return {
    userId: member.user.id,
    username: member.user.username,
    globalName: member.user.global_name ?? null,
    displayName: displayName(member.user, member.nick),
    avatarUrl: memberAvatarUrl(guildId, member),
    bot: Boolean(member.user.bot),
    joinedAt: member.joined_at ?? null,
    timedOutUntil: member.communication_disabled_until ?? null,
    roles: [],
  };
}

/**
 * `BotGateway` sin gateway vivo: todas las lecturas por REST (con caché L2 de
 * Redis vía `CacheStore` a medio plazo). Las escrituras las hereda de
 * `BaseGateway`. Lo usa el rol `api`.
 */
export class RestGateway extends BaseGateway implements BotGateway {
  isReady(): boolean {
    return true;
  }

  private async guildRoles(guildId: string): Promise<APIRole[]> {
    return (await this.restClient().get(
      Routes.guildRoles(guildId),
    )) as APIRole[];
  }

  async getGuild(guildId: string): Promise<GuildSummary | null> {
    try {
      const guild = (await this.restClient().get(Routes.guild(guildId))) as {
        id: string;
        name: string;
        icon?: string | null;
      };
      const roles = await this.guildRoles(guildId);
      const booster = roles.find((r) => r.tags?.premium_subscriber_role);
      return {
        id: guild.id,
        name: guild.name,
        iconUrl: guild.icon
          ? cdn.icon(guild.id, guild.icon, { extension: "png", size: 256 })
          : null,
        boosterRoleId: booster?.id ?? null,
      };
    } catch {
      return null;
    }
  }

  async listChannels(guildId: string): Promise<ChannelSummary[]> {
    const channels = (await this.restClient().get(
      Routes.guildChannels(guildId),
    )) as APIChannel[];
    return channels.map((c) => ({
      id: c.id,
      name: c.name ?? "",
      type: c.type,
      parentId: c.parent_id ?? null,
      position: c.position ?? 0,
    }));
  }

  async listRoles(guildId: string): Promise<RoleSummary[]> {
    return (await this.guildRoles(guildId)).map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      hexColor: hex(r.color),
      position: r.position,
      managed: r.managed,
    }));
  }

  async listEmojis(guildId: string): Promise<EmojiSummary[]> {
    const emojis = (await this.restClient().get(
      Routes.guildEmojis(guildId),
    )) as { id: string | null; name: string | null; animated?: boolean }[];
    return emojis
      .filter((e): e is { id: string; name: string; animated?: boolean } =>
        Boolean(e.id && e.name),
      )
      .map((e) => ({
        id: e.id,
        name: e.name,
        animated: Boolean(e.animated),
        url: cdn.emoji(e.id, { extension: e.animated ? "gif" : "png" }),
      }));
  }

  async listStickers(guildId: string): Promise<StickerSummary[]> {
    const stickers = (await this.restClient().get(
      Routes.guildStickers(guildId),
    )) as {
      id: string;
      name: string;
      description: string | null;
      format_type: number;
    }[];
    return stickers.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      format: String(s.format_type),
      url: cdn.sticker(s.id, "png"),
    }));
  }

  private async channelInGuild(
    guildId: string,
    channelId: string,
  ): Promise<APIChannel | null> {
    try {
      const channel = (await this.restClient().get(
        Routes.channel(channelId),
      )) as APIChannel;
      if (channel.guild_id && channel.guild_id !== guildId) return null;
      return channel;
    } catch {
      return null;
    }
  }

  async getChannel(
    guildId: string,
    channelId: string,
  ): Promise<ChannelSummary | null> {
    const c = await this.channelInGuild(guildId, channelId);
    if (!c) return null;
    return {
      id: c.id,
      name: c.name ?? "",
      type: c.type,
      parentId: c.parent_id ?? null,
      position: c.position ?? 0,
    };
  }

  async getChannelDetail(
    guildId: string,
    channelId: string,
  ): Promise<ChannelDetail | null> {
    const c = await this.channelInGuild(guildId, channelId);
    if (!c) return null;
    return {
      id: c.id,
      name: c.name ?? "",
      type: c.type,
      parentId: c.parent_id ?? null,
      position: c.position ?? 0,
      topic: c.topic ?? null,
      slowmodeSeconds: c.rate_limit_per_user ?? 0,
      nsfw: Boolean(c.nsfw),
    };
  }

  async getUser(userId: string): Promise<UserInfo | null> {
    try {
      const user = (await this.restClient().get(
        Routes.user(userId),
      )) as APIUser;
      return {
        userId: user.id,
        username: user.username,
        globalName: user.global_name ?? null,
        displayName: displayName(user),
        avatarUrl: userAvatarUrl(user),
      };
    } catch {
      return null;
    }
  }

  private async rawMember(
    guildId: string,
    userId: string,
  ): Promise<APIMember | null> {
    try {
      return (await this.restClient().get(
        Routes.guildMember(guildId, userId),
      )) as APIMember;
    } catch {
      return null;
    }
  }

  async resolveMembers(
    guildId: string,
    userIds: string[],
  ): Promise<Map<string, MemberProfile>> {
    const unique = [...new Set(userIds.filter(Boolean))];
    const out = new Map<string, MemberProfile>();
    await Promise.all(
      unique.map(async (userId) => {
        const member = await this.rawMember(guildId, userId);
        if (member) {
          out.set(userId, {
            userId,
            username: member.user.username,
            displayName: displayName(member.user, member.nick),
            avatarUrl: memberAvatarUrl(guildId, member),
          });
          return;
        }
        const user = await this.getUser(userId);
        out.set(userId, {
          userId,
          username: user?.username ?? "desconocido",
          displayName: user?.displayName ?? "Unknown User",
          avatarUrl: user?.avatarUrl ?? null,
        });
      }),
    );
    return out;
  }

  private async listRawMembers(guildId: string): Promise<APIMember[]> {
    const all: APIMember[] = [];
    let after = "0";
    for (let page = 0; page < 50; page++) {
      const batch = (await this.restClient().get(Routes.guildMembers(guildId), {
        query: new URLSearchParams({ limit: "1000", after }),
      })) as APIMember[];
      all.push(...batch);
      if (batch.length < 1000) break;
      after = batch[batch.length - 1]!.user.id;
    }
    return all;
  }

  async listMembers(guildId: string): Promise<MemberInfo[]> {
    const [members, roles] = await Promise.all([
      this.listRawMembers(guildId),
      this.guildRoles(guildId),
    ]);
    const roleById = new Map(roles.map((r) => [r.id, r]));
    return members.map((m) => ({
      ...toMemberInfo(guildId, m),
      roles: m.roles
        .map((id) => roleById.get(id))
        .filter((r): r is APIRole => Boolean(r) && r?.id !== guildId)
        .sort((a, b) => b.position - a.position)
        .map((r) => ({ id: r.id, name: r.name, hexColor: hex(r.color) })),
    }));
  }

  async getMember(guildId: string, userId: string): Promise<MemberInfo | null> {
    const member = await this.rawMember(guildId, userId);
    if (!member) return null;
    const roles = await this.guildRoles(guildId);
    const roleById = new Map(roles.map((r) => [r.id, r]));
    return {
      ...toMemberInfo(guildId, member),
      roles: member.roles
        .map((id) => roleById.get(id))
        .filter((r): r is APIRole => Boolean(r) && r?.id !== guildId)
        .sort((a, b) => b.position - a.position)
        .map((r) => ({ id: r.id, name: r.name, hexColor: hex(r.color) })),
    };
  }

  async listBans(guildId: string): Promise<GuildBanEntry[]> {
    const all: { user: APIUser; reason?: string | null }[] = [];
    let after = "0";
    for (let page = 0; page < 50; page++) {
      const batch = (await this.restClient().get(Routes.guildBans(guildId), {
        query: new URLSearchParams({ limit: "1000", after }),
      })) as { user: APIUser; reason?: string | null }[];
      all.push(...batch);
      if (batch.length < 1000) break;
      after = batch[batch.length - 1]!.user.id;
    }
    return all.map((ban) => ({
      userId: ban.user.id,
      username: ban.user.username,
      globalName: ban.user.global_name ?? null,
      displayName: displayName(ban.user),
      avatarUrl: userAvatarUrl(ban.user),
      reason: ban.reason?.trim() || null,
    }));
  }

  async getRoleAdminContext(
    guildId: string,
  ): Promise<BotRoleAdminContext | null> {
    const [guild, roles, me] = await Promise.all([
      this.getGuild(guildId),
      this.guildRoles(guildId),
      this.rawMember(guildId, "@me"),
    ]);
    if (!guild || !me) return null;

    const roleById = new Map(roles.map((r) => [r.id, r]));
    const myRoles = me.roles
      .map((id) => roleById.get(id))
      .filter((r): r is APIRole => Boolean(r));
    const perms = myRoles.reduce((acc, r) => acc | BigInt(r.permissions), 0n);
    const canManageRoles =
      (perms & PermissionFlagsBits.Administrator) ===
        PermissionFlagsBits.Administrator ||
      (perms & PermissionFlagsBits.ManageRoles) ===
        PermissionFlagsBits.ManageRoles;
    const highest = myRoles
      .filter((r) => r.id !== guildId)
      .sort((a, b) => b.position - a.position)[0];

    return {
      guildName: guild.name,
      roleCount: roles.length,
      bot: {
        highestRoleId: highest?.id ?? null,
        highestPosition: highest?.position ?? 0,
        canManageRoles,
        roleName: highest?.name ?? null,
      },
      roles: roles
        .filter((r) => r.id !== guildId)
        .map(
          (r): RoleDetail => ({
            id: r.id,
            name: r.name,
            color: r.color,
            hexColor: hex(r.color),
            position: r.position,
            managed: r.managed,
            hoist: r.hoist,
            mentionable: r.mentionable,
            permissions: BigInt(r.permissions),
          }),
        )
        .sort((a, b) => b.position - a.position),
    };
  }

  async fetchAuditLog(
    guildId: string,
    opts: { limit?: number; userId?: string; actionType?: number } = {},
  ): Promise<AuditLogPage> {
    const query = new URLSearchParams({
      limit: String(Math.max(1, Math.min(100, Math.round(opts.limit ?? 100)))),
    });
    if (opts.userId) query.set("user_id", opts.userId);
    if (opts.actionType && opts.actionType >= 1) {
      query.set("action_type", String(opts.actionType));
    }

    let res: {
      audit_log_entries: {
        id: string;
        action_type: number;
        user_id?: string | null;
        target_id?: string | null;
        reason?: string | null;
        changes?: { key: string; old_value?: unknown; new_value?: unknown }[];
      }[];
      users: APIUser[];
    };
    try {
      res = (await this.restClient().get(Routes.guildAuditLog(guildId), {
        query,
      })) as typeof res;
    } catch (error) {
      if (isForbidden(error)) {
        throw new BotGatewayError(
          "Missing the «View Audit Log» permission.",
          403,
          "MISSING_PERMISSIONS",
        );
      }
      throw error;
    }

    const users: AuditLogUserRef[] = res.users.map((u) => ({
      id: u.id,
      username: u.username,
      globalName: u.global_name ?? null,
      displayName: displayName(u),
      avatarUrl: userAvatarUrl(u),
    }));

    return {
      entries: res.audit_log_entries.map((e) => ({
        id: e.id,
        actionType: e.action_type,
        executorId: e.user_id ?? null,
        targetId: e.target_id ?? null,
        reason: e.reason?.trim() || null,
        createdAt: snowflakeToISO(e.id),
        changes: (e.changes ?? []).map((c) => ({
          key: c.key,
          oldValue: c.old_value,
          newValue: c.new_value,
        })),
      })),
      users,
    };
  }

  async getMemberActionability(
    guildId: string,
    userId: string,
  ): Promise<MemberActionability | null> {
    const [target, me, guildRaw, roles] = await Promise.all([
      this.rawMember(guildId, userId),
      this.rawMember(guildId, "@me"),
      this.restClient()
        .get(Routes.guild(guildId))
        .catch(() => null) as Promise<{ owner_id?: string } | null>,
      this.guildRoles(guildId),
    ]);
    if (!target || !me) return null;

    const roleById = new Map(roles.map((r) => [r.id, r]));
    const highestPos = (ids: string[]): number =>
      ids.reduce(
        (max, id) => Math.max(max, roleById.get(id)?.position ?? 0),
        0,
      );
    const permsOf = (ids: string[]): bigint => {
      const everyone = roleById.get(guildId);
      let acc = everyone ? BigInt(everyone.permissions) : 0n;
      for (const id of ids) {
        const role = roleById.get(id);
        if (role) acc |= BigInt(role.permissions);
      }
      return acc;
    };

    const botUserId = me.user.id;
    const ownerId = guildRaw?.owner_id;
    const botIsOwner = botUserId === ownerId;
    const botPerms = permsOf(me.roles);
    const isAdmin = (perms: bigint): boolean =>
      (perms & PermissionFlagsBits.Administrator) ===
      PermissionFlagsBits.Administrator;
    const botHas = (bit: bigint): boolean =>
      botIsOwner || isAdmin(botPerms) || (botPerms & bit) === bit;

    const targetPerms = permsOf(target.roles);
    const targetIsAdmin = target.user.id === ownerId || isAdmin(targetPerms);
    const manageable =
      target.user.id !== ownerId &&
      target.user.id !== botUserId &&
      (botIsOwner || highestPos(me.roles) > highestPos(target.roles));

    return {
      isBot: target.user.id === botUserId,
      isOwner: target.user.id === ownerId,
      bannable: manageable && botHas(PermissionFlagsBits.BanMembers),
      kickable: manageable && botHas(PermissionFlagsBits.KickMembers),
      moderatable:
        manageable &&
        botHas(PermissionFlagsBits.ModerateMembers) &&
        !targetIsAdmin,
    };
  }

  async getChannelOverwrites(
    guildId: string,
    channelId: string,
  ): Promise<ChannelOverwrite[] | null> {
    const channel = await this.channelInGuild(guildId, channelId);
    if (!channel) return null;
    return (channel.permission_overwrites ?? []).map((o) => ({
      id: o.id,
      type: Number(o.type),
      allow: o.allow,
      deny: o.deny,
    }));
  }

  async botHasGuildPermission(
    guildId: string,
    permission: bigint,
  ): Promise<boolean> {
    const [roles, me] = await Promise.all([
      this.guildRoles(guildId),
      this.rawMember(guildId, "@me"),
    ]);
    if (!me) return false;
    const roleById = new Map(roles.map((r) => [r.id, r]));
    const everyone = roleById.get(guildId);
    let perms = everyone ? BigInt(everyone.permissions) : 0n;
    for (const id of me.roles) {
      const role = roleById.get(id);
      if (role) perms |= BigInt(role.permissions);
    }
    if (
      (perms & PermissionFlagsBits.Administrator) ===
      PermissionFlagsBits.Administrator
    ) {
      return true;
    }
    return (perms & permission) === permission;
  }

  async listAutoModRules(guildId: string): Promise<AutoModRuleSummary[]> {
    const rules = (await this.restClient().get(
      Routes.guildAutoModerationRules(guildId),
    )) as {
      id: string;
      name: string;
      enabled: boolean;
      event_type: number;
      trigger_type: number;
    }[];
    return rules.map((r) => ({
      id: r.id,
      name: r.name,
      enabled: r.enabled,
      eventType: r.event_type,
      triggerType: r.trigger_type,
    }));
  }

  async getBotProfile(guildId: string): Promise<BotProfileSummary> {
    const [guild, me] = await Promise.all([
      this.getGuild(guildId),
      this.rawMember(guildId, "@me"),
    ]);
    if (!guild || !me) {
      throw Object.assign(new Error("Bot not in guild"), {
        status: 404,
        code: "GUILD_NOT_FOUND",
      });
    }
    return {
      guildId,
      guildName: guild.name,
      nickname: me.nick ?? "",
      displayName: displayName(me.user, me.nick),
      username: me.user.username,
      tag: me.user.discriminator
        ? `${me.user.username}#${me.user.discriminator}`
        : me.user.username,
      serverAvatarUrl: me.avatar
        ? cdn.guildMemberAvatar(guildId, me.user.id, me.avatar, AVATAR)
        : null,
      globalAvatarUrl: userAvatarUrl(me.user),
      hasServerAvatar: Boolean(me.avatar),
    };
  }

  async fetchMessage(
    guildId: string,
    channelId: string,
    messageId: string,
  ): Promise<FetchedMessage> {
    const channel = await this.channelInGuild(guildId, channelId);
    if (!channel) {
      throw Object.assign(new Error("Channel not found"), {
        status: 404,
        code: "CHANNEL_NOT_FOUND",
      });
    }
    let message: {
      id: string;
      channel_id: string;
      content?: string;
      embeds?: Record<string, unknown>[];
      author: APIUser;
      member?: { nick?: string | null };
      reactions?: {
        count: number;
        emoji: { id: string | null; name: string | null; animated?: boolean };
      }[];
    };
    try {
      message = (await this.restClient().get(
        Routes.channelMessage(channelId, messageId),
      )) as typeof message;
    } catch {
      throw Object.assign(new Error("Message not found"), {
        status: 404,
        code: "MESSAGE_NOT_FOUND",
      });
    }

    const meRes = (await this.restClient()
      .get(Routes.user("@me"))
      .catch(() => null)) as APIUser | null;

    return {
      id: message.id,
      channelId: channel.id,
      content: message.content ?? "",
      embeds: (message.embeds ?? []).map((e) => ({
        title: (e.title as string) ?? undefined,
        description: (e.description as string) ?? undefined,
        url: (e.url as string) ?? undefined,
        color: typeof e.color === "number" ? hex(e.color as number) : undefined,
        authorName: (e.author as { name?: string })?.name ?? undefined,
        authorIconUrl:
          (e.author as { icon_url?: string })?.icon_url ?? undefined,
        thumbnailUrl: (e.thumbnail as { url?: string })?.url ?? undefined,
        imageUrl: (e.image as { url?: string })?.url ?? undefined,
        footerText: (e.footer as { text?: string })?.text ?? undefined,
        footerIconUrl:
          (e.footer as { icon_url?: string })?.icon_url ?? undefined,
        timestamp: Boolean(e.timestamp),
      })),
      author: {
        id: message.author.id,
        username: message.author.username,
        displayName: displayName(message.author, message.member?.nick),
        avatarUrl: userAvatarUrl(message.author),
      },
      isBotAuthor: Boolean(meRes && message.author.id === meRes.id),
      reactions: (message.reactions ?? []).map((r) => {
        if (r.emoji.id) {
          return {
            emojiKey: `custom:${r.emoji.id}`,
            name: r.emoji.name,
            id: r.emoji.id,
            animated: Boolean(r.emoji.animated),
            imageUrl: cdn.emoji(r.emoji.id, {
              extension: r.emoji.animated ? "gif" : "png",
            }),
            count: r.count,
          };
        }
        return {
          emojiKey: `unicode:${r.emoji.name ?? "?"}`,
          name: r.emoji.name,
          id: null,
          animated: false,
          imageUrl: null,
          count: r.count,
        };
      }),
    };
  }
}
