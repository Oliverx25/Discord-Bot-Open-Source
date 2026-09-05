import { Routes } from "discord.js";
import type { Constructor } from "../baseGateway/core.js";
import {
  type AuditLogPage,
  type AuditLogUserRef,
  BotGatewayError,
} from "../botGateway.js";
import {
  type APIUser,
  displayName,
  type RestGatewayCore,
  userAvatarUrl,
} from "./core.js";

function isForbidden(error: unknown): boolean {
  const e = error as { status?: unknown; code?: unknown };
  return e?.status === 403 || e?.code === 50013;
}

const DISCORD_EPOCH = 1_420_070_400_000n;

function snowflakeToISO(id: string): string {
  return new Date(Number((BigInt(id) >> 22n) + DISCORD_EPOCH)).toISOString();
}

/** Audit log de Discord (crudo) vía REST. */
export function ModerationMixin<TBase extends Constructor<RestGatewayCore>>(
  Base: TBase,
) {
  return class extends Base {
    async fetchAuditLog(
      guildId: string,
      opts: { limit?: number; userId?: string; actionType?: number } = {},
    ): Promise<AuditLogPage> {
      const query = new URLSearchParams({
        limit: String(
          Math.max(1, Math.min(100, Math.round(opts.limit ?? 100))),
        ),
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
  };
}
