import { ChannelType, EmbedBuilder } from "discord.js";
import { Router } from "express";
import type { BotGateway } from "#core/discord/botGateway.js";
import { guildIdOf } from "#core/http/guildContext.js";
import { defineRoute } from "#core/http/validate.js";
import {
  AntiRaidError,
  getAntiRaidConfig,
  getAntiRaidSettings,
  updateAntiRaidSettings,
} from "../domain/anti-raid.js";
import { applyGuildLockdown, liftGuildLockdown } from "../lockdown.js";
import { lockdownBodySchema, updateAntiRaidSettingsSchema } from "./schema.js";

const ALERT_COLOR = 0xed4245;

async function assertAlertChannel(
  gateway: BotGateway,
  channelId: string,
  guildId: string,
): Promise<void> {
  const channel = await gateway.getChannel(guildId, channelId);
  if (!channel) {
    throw new AntiRaidError("Channel not found.", 404, "CHANNEL_NOT_FOUND");
  }
  if (
    channel.type !== ChannelType.GuildText &&
    channel.type !== ChannelType.GuildAnnouncement
  ) {
    throw new AntiRaidError(
      "Use a text or announcement channel for the alerts.",
      400,
      "INVALID_CHANNEL_TYPE",
    );
  }
}

/** Alerta de lockdown al canal configurado — best-effort. */
async function sendLockdownAlert(
  gateway: BotGateway,
  guildId: string,
  channelId: string | null | undefined,
  description: string,
): Promise<void> {
  if (!channelId) return;
  try {
    await gateway.sendMessage(guildId, channelId, {
      embeds: [
        new EmbedBuilder()
          .setColor(ALERT_COLOR)
          .setTitle("Lockdown")
          .setDescription(description.slice(0, 4096))
          .setTimestamp(new Date())
          .toJSON(),
      ],
      allowedMentions: { parse: [] },
    });
  } catch {
    // best-effort: si la alerta no sale, el lockdown ya se aplicó.
  }
}

export function antiRaidRoutes(gateway: BotGateway): Router {
  const router = Router();

  router.get(
    "/",
    defineRoute({}, async (req, res) => {
      res.json(await getAntiRaidConfig(guildIdOf(req)));
    }),
  );

  router.patch(
    "/settings",
    defineRoute(
      { body: updateAntiRaidSettingsSchema },
      async (req, res, valid) => {
        const guildId = guildIdOf(req);
        if (
          typeof valid.body.alertChannelId === "string" &&
          valid.body.alertChannelId.trim()
        ) {
          await assertAlertChannel(
            gateway,
            valid.body.alertChannelId.trim(),
            guildId,
          );
        }
        const settings = await updateAntiRaidSettings(valid.body, guildId);
        res.json({ settings });
      },
    ),
  );

  router.post(
    "/lockdown",
    defineRoute({ body: lockdownBodySchema }, async (req, res, valid) => {
      const guildId = guildIdOf(req);
      const guild = await gateway.getGuild(guildId);
      if (!guild) {
        throw new AntiRaidError("Server not found.", 404, "GUILD_NOT_FOUND");
      }
      const settings = await getAntiRaidSettings(guildId);
      const actorId = req.guild?.userId ?? null;
      if (valid.body.active) {
        const result = await applyGuildLockdown(gateway, guildId, actorId);
        await sendLockdownAlert(
          gateway,
          guildId,
          settings.alertChannelId,
          `Lockdown activated from the panel. Channels: ${result.channels}.`,
        );
      } else {
        const result = await liftGuildLockdown(gateway, guildId);
        await sendLockdownAlert(
          gateway,
          guildId,
          settings.alertChannelId,
          `Lockdown removed from the panel. Channels: ${result.channels}.`,
        );
      }
      res.json(await getAntiRaidConfig(guildId));
    }),
  );

  return router;
}
