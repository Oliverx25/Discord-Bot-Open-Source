import { Router } from "express";
import { z } from "zod";
import type { BotGateway } from "#core/discord/botGateway.js";
import { guildIdOf, requireGuildCapability } from "#core/http/guildContext.js";
import { snowflake } from "#core/http/schemas.js";
import { defineRoute } from "#core/http/validate.js";
import {
  createGuildRole,
  deleteGuildRole,
  listGuildRoles,
  updateGuildRole,
  updateRolePositions,
} from "../discord.js";
import {
  createGuildRoleSchema,
  updateGuildRoleSchema,
  updateRolePositionsSchema,
} from "./schema.js";

const roleIdParams = z.object({ roleId: snowflake });

/**
 * Rutas: GET /list · POST /create · PATCH /positions · PATCH|DELETE /:roleId.
 * Las de escritura exigen `roles.write` (SEC-01): `ManageGuild` solo no debe
 * bastar para crear un rol con permisos arbitrarios (incl. Administrator) y
 * asignárselo — es la vía más directa para amplificar a toda la autoridad
 * del bot.
 */
export function rolesBuilderRoutes(gateway: BotGateway): Router {
  const router = Router();
  const requireRolesWrite = requireGuildCapability("roles.write");

  router.get(
    "/list",
    defineRoute({}, async (req, res) => {
      res.json(await listGuildRoles(gateway, guildIdOf(req)));
    }),
  );

  router.post(
    "/create",
    requireRolesWrite,
    defineRoute({ body: createGuildRoleSchema }, async (req, res, valid) => {
      const data = await createGuildRole(gateway, valid.body, guildIdOf(req));
      res.status(201).json(data);
    }),
  );

  router.patch(
    "/positions",
    requireRolesWrite,
    defineRoute(
      { body: updateRolePositionsSchema },
      async (req, res, valid) => {
        const data = await updateRolePositions(
          gateway,
          valid.body.positions,
          guildIdOf(req),
        );
        res.json(data);
      },
    ),
  );

  router.patch(
    "/:roleId",
    requireRolesWrite,
    defineRoute(
      { params: roleIdParams, body: updateGuildRoleSchema },
      async (req, res, valid) => {
        const data = await updateGuildRole(
          gateway,
          valid.params.roleId,
          valid.body,
          guildIdOf(req),
        );
        res.json(data);
      },
    ),
  );

  router.delete(
    "/:roleId",
    requireRolesWrite,
    defineRoute({ params: roleIdParams }, async (req, res, valid) => {
      const data = await deleteGuildRole(
        gateway,
        valid.params.roleId,
        guildIdOf(req),
      );
      res.json(data);
    }),
  );

  return router;
}
