import { Router } from "express";
import type { BotGateway } from "#core/discord/botGateway.js";
import { guildIdOf } from "#core/http/guildContext.js";
import { idParams } from "#core/http/schemas.js";
import { defineRoute, parse } from "#core/http/validate.js";
import { logger } from "#core/log.js";
import {
  createAutoroleCompact,
  deleteAutorole,
  listActiveAutoroles,
  updateAutoroleContent,
  updateAutoroleMapping,
} from "../registry.js";
import {
  AutoRoleError,
  createAutoRoleSetup,
  placeReactionsViaGateway,
  resolveSendableChannelId,
  saveReactionRoleMappings,
} from "./controller.js";
import {
  createAutoRoleLegacySchema,
  createAutoroleCompactSchema,
  saveReactionRolesSchema,
  updateAutoroleContentSchema,
  updateAutoroleMappingSchema,
} from "./schema.js";

export function autoroleRoutes(gateway: BotGateway): Router {
  const router = Router();

  /** GET /api/autoroles/active */
  router.get(
    "/active",
    defineRoute({}, async (req, res) => {
      res.json(await listActiveAutoroles(gateway, guildIdOf(req)));
    }),
  );

  /** POST /api/autoroles/reactions */
  router.post(
    "/reactions",
    defineRoute({ body: saveReactionRolesSchema }, async (req, res, valid) => {
      const payload = {
        guildId: guildIdOf(req),
        channelId: valid.body.channelId,
        messageId: valid.body.messageId,
        mappings: valid.body.mappings,
      };

      const channelId = await resolveSendableChannelId(
        gateway,
        payload.channelId,
        payload.guildId,
      );
      await gateway
        .fetchMessage(payload.guildId, channelId, payload.messageId)
        .catch(() => {
          throw new AutoRoleError(
            "That message was not found in the channel.",
            404,
            "MESSAGE_NOT_FOUND",
          );
        });

      const result = await saveReactionRoleMappings(payload, gateway);

      try {
        await placeReactionsViaGateway(
          gateway,
          payload.guildId,
          channelId,
          payload.messageId,
          payload.mappings.map((mapping) => mapping.emojiKey),
        );
      } catch (error: unknown) {
        logger.warn(
          { err: error },
          "Mappings saved, but reactions couldn't be added:",
        );
      }

      res.status(201).json(result);
    }),
  );

  /** POST /api/autoroles/create — compacto (preferido) o legacy */
  router.post(
    "/create",
    defineRoute({}, async (req, res) => {
      const raw = req.body as Record<string, unknown> | undefined;
      if (raw && typeof raw.type === "string") {
        const payload = parse(createAutoroleCompactSchema, raw);
        const result = await createAutoroleCompact(gateway, {
          ...payload,
          guildId: guildIdOf(req),
        });
        res.status(201).json(result);
        return;
      }

      const payload = parse(createAutoRoleLegacySchema, raw);
      const result = await createAutoRoleSetup(gateway, {
        ...payload,
        guildId: guildIdOf(req),
      });
      res.status(201).json(result);
    }),
  );

  /** PUT /api/autoroles/update-mapping/:id */
  router.put(
    "/update-mapping/:id",
    defineRoute(
      { params: idParams, body: updateAutoroleMappingSchema },
      async (req, res, valid) => {
        const result = await updateAutoroleMapping(
          gateway,
          valid.params.id,
          valid.body,
          guildIdOf(req),
        );
        res.json(result);
      },
    ),
  );

  /** PUT /api/autoroles/update-content/:id */
  router.put(
    "/update-content/:id",
    defineRoute(
      { params: idParams, body: updateAutoroleContentSchema },
      async (req, res, valid) => {
        const result = await updateAutoroleContent(
          gateway,
          valid.params.id,
          valid.body,
          guildIdOf(req),
        );
        res.json(result);
      },
    ),
  );

  /** Alias: PUT /api/autoroles/edit-content/:id */
  router.put(
    "/edit-content/:id",
    defineRoute(
      { params: idParams, body: updateAutoroleContentSchema },
      async (req, res, valid) => {
        const result = await updateAutoroleContent(
          gateway,
          valid.params.id,
          valid.body,
          guildIdOf(req),
        );
        res.json(result);
      },
    ),
  );

  /** DELETE /api/autoroles/delete/:id */
  router.delete(
    "/delete/:id",
    defineRoute({ params: idParams }, async (req, res, valid) => {
      const result = await deleteAutorole(
        gateway,
        valid.params.id,
        guildIdOf(req),
      );
      res.json(result);
    }),
  );

  return router;
}
