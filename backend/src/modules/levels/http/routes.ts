import type {
  LevelsLeaderboardEntry,
  LevelsLeaderboardResponse,
} from "@adobos/shared";
import { Router } from "express";
import type { BotGateway } from "#core/discord/botGateway.js";
import { guildIdOf } from "#core/http/guildContext.js";
import { leaderboardQuerySchema } from "#core/http/schemas.js";
import { defineRoute } from "#core/http/validate.js";
import {
  getLeaderboardTotal,
  getLevelsConfig,
  listLeaderboardRows,
  updateLevelsConfig,
} from "../domain/levels.js";
import { forceLiveLeaderboardRefresh } from "../liveLeaderboard.js";
import { updateLevelsConfigSchema } from "./schema.js";

async function resolveLeaderboardEntries(
  gateway: BotGateway,
  guildId: string,
  limit: number,
): Promise<LevelsLeaderboardResponse> {
  const rows = await listLeaderboardRows(guildId, limit);
  const total = await getLeaderboardTotal(guildId);

  const resolved = await gateway.resolveMembers(
    guildId,
    rows.map((row) => row.userId),
  );

  const entries: LevelsLeaderboardEntry[] = rows.map((row) => {
    const member = resolved.get(row.userId);
    return {
      rank: row.rank,
      userId: row.userId,
      username: member?.username ?? row.userId,
      displayName: member?.displayName ?? "Unknown User",
      avatarUrl: member?.avatarUrl ?? null,
      level: row.level,
      xp: row.xp,
    };
  });

  return { entries, total };
}

export function levelsRoutes(gateway: BotGateway): Router {
  const router = Router();

  /** GET /api/levels/config */
  router.get(
    "/config",
    defineRoute({}, async (req, res) => {
      const config = await getLevelsConfig(guildIdOf(req));
      res.json({ config });
    }),
  );

  /** POST /api/levels/config */
  router.post(
    "/config",
    defineRoute({ body: updateLevelsConfigSchema }, async (req, res, valid) => {
      const guildId = guildIdOf(req);
      const before = await getLevelsConfig(guildId);
      const config = await updateLevelsConfig(valid.body, guildId);

      if (
        valid.body.liveLeaderboardChannelId !== undefined &&
        valid.body.liveLeaderboardChannelId !==
          before.liveLeaderboardChannelId &&
        config.liveLeaderboardChannelId
      ) {
        await forceLiveLeaderboardRefresh(gateway, config.guildId);
      }

      res.json({ config });
    }),
  );

  /** GET /api/levels/leaderboard?limit=100 */
  router.get(
    "/leaderboard",
    defineRoute({ query: leaderboardQuerySchema }, async (req, res, valid) => {
      const limit = valid.query.limit ?? 100;
      const payload = await resolveLeaderboardEntries(
        gateway,
        guildIdOf(req),
        limit,
      );
      res.json(payload);
    }),
  );

  return router;
}
