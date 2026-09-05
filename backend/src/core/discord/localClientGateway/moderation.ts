import { DiscordAPIError, type User } from "discord.js";
import { safeAvatarOptions } from "#lib/discordMember.js";
import type { Constructor } from "../baseGateway/core.js";
import {
  type AuditLogPage,
  type AuditLogUserRef,
  BotGatewayError,
} from "../botGateway.js";
import type { LocalClientGatewayCore } from "./core.js";

/** Audit log de Discord (crudo) sobre el `Client` vivo. */
export function ModerationMixin<
  TBase extends Constructor<LocalClientGatewayCore>,
>(Base: TBase) {
  return class extends Base {
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
  };
}
