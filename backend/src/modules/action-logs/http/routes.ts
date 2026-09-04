import { Router } from "express";
import type { BotGateway } from "#core/discord/botGateway.js";
import { guildIdOf } from "#core/http/guildContext.js";
import { defineRoute } from "#core/http/validate.js";
import {
  getActionLogsConfig,
  listActionLogsHistory,
  sendActionLogsTestEmbed,
  updateActionLogsConfig,
} from "../discord.js";
import {
  actionLogsHistoryQuerySchema,
  updateActionLogsConfigSchema,
} from "./schema.js";

export function actionLogsRoutes(gateway: BotGateway): Router {
  const router = Router();

  /** GET /api/logs/config */
  router.get(
    "/config",
    defineRoute({}, async (req, res) => {
      const config = await getActionLogsConfig(guildIdOf(req));
      res.json({ config });
    }),
  );

  /** POST /api/logs/config */
  router.post(
    "/config",
    defineRoute(
      { body: updateActionLogsConfigSchema },
      async (req, res, valid) => {
        const config = await updateActionLogsConfig(valid.body, guildIdOf(req));
        res.json({ config });
      },
    ),
  );

  /** GET /api/logs/history */
  router.get(
    "/history",
    defineRoute(
      { query: actionLogsHistoryQuerySchema },
      async (req, res, valid) => {
        const result = await listActionLogsHistory({
          guildId: guildIdOf(req),
          category: valid.query.category as never,
          q: valid.query.q,
          from: valid.query.from,
          to: valid.query.to,
          page: valid.query.page,
          limit: valid.query.limit,
        });
        res.json(result);
      },
    ),
  );

  /** POST /api/logs/test */
  router.post(
    "/test",
    defineRoute({}, async (req, res) => {
      const result = await sendActionLogsTestEmbed(gateway, guildIdOf(req));
      res.json(result);
    }),
  );

  return router;
}
