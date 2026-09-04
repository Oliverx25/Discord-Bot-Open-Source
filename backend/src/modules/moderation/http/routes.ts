import { Router } from "express";
import { z } from "zod";
import type { BotGateway } from "#core/discord/botGateway.js";
import { guildIdOf } from "#core/http/guildContext.js";
import { searchQuerySchema, snowflake } from "#core/http/schemas.js";
import { defineRoute } from "#core/http/validate.js";
import { fetchDiscordAuditLog } from "../audit.js";
import {
  executeModAction,
  fetchDiscordMessage,
  getChannelInfo,
  getMemberInfo,
  listActiveBans,
  listActiveTimeouts,
  searchChannels,
  searchMembers,
} from "../discord.js";
import {
  discordAuditQuerySchema,
  fetchMessageQuerySchema,
  modActionSchema,
} from "./schema.js";

const snowflakeIdParams = z.object({ id: snowflake });

/** Rutas de moderación del panel — todas vía `BotGateway` (rol `api` incluido). */
export function moderationReadRoutes(gateway: BotGateway): Router {
  const router = Router();

  router.get(
    "/search-member",
    defineRoute({ query: searchQuerySchema }, async (req, res, valid) => {
      res.json(
        await searchMembers(gateway, valid.query.q ?? "", guildIdOf(req)),
      );
    }),
  );

  router.get(
    "/search-channel",
    defineRoute({ query: searchQuerySchema }, async (req, res, valid) => {
      res.json(
        await searchChannels(gateway, valid.query.q ?? "", guildIdOf(req)),
      );
    }),
  );

  router.get(
    "/member-info/:id",
    defineRoute({ params: snowflakeIdParams }, async (req, res, valid) => {
      res.json(await getMemberInfo(gateway, valid.params.id, guildIdOf(req)));
    }),
  );

  router.get(
    "/channel-info/:id",
    defineRoute({ params: snowflakeIdParams }, async (req, res, valid) => {
      res.json(await getChannelInfo(gateway, valid.params.id, guildIdOf(req)));
    }),
  );

  router.get(
    "/active/bans",
    defineRoute({}, async (req, res) => {
      res.json(await listActiveBans(gateway, guildIdOf(req)));
    }),
  );

  router.get(
    "/active/timeouts",
    defineRoute({}, async (req, res) => {
      res.json(await listActiveTimeouts(gateway, guildIdOf(req)));
    }),
  );

  router.get(
    "/fetch-message",
    defineRoute({ query: fetchMessageQuerySchema }, async (req, res, valid) => {
      res.json(
        await fetchDiscordMessage(
          gateway,
          valid.query.channelId,
          valid.query.messageId,
          guildIdOf(req),
        ),
      );
    }),
  );

  router.post(
    "/action",
    defineRoute({ body: modActionSchema }, async (req, res, valid) => {
      const result = await executeModAction(
        gateway,
        { ...valid.body, guildId: guildIdOf(req) },
        req.guild?.userId,
      );
      res.status(result.dmFailed ? 206 : 200).json(result);
    }),
  );

  router.get(
    "/discord-audit",
    defineRoute({ query: discordAuditQuerySchema }, async (req, res, valid) => {
      res.json(
        await fetchDiscordAuditLog(gateway, {
          guildId: guildIdOf(req),
          limit: valid.query.limit ?? 100,
          userId: valid.query.userId,
          actionType: valid.query.actionType,
        }),
      );
    }),
  );

  return router;
}
