/**
 * Métricas del Client de Discord (Fase 8, PLAN_FINAL_2026.md, §14): 429 de
 * REST, reconnects/shards. Solo aplica al rol `gateway` (único con un Client
 * vivo — `installDiscordMetrics` se llama una sola vez, junto a
 * `installCacheWarmer`, en `index.ts`).
 */

import { Counter } from "@prometheus-io/client";
import type { Client } from "discord.js";
import { metricsRegistry } from "./registry.js";

const restRateLimited = new Counter({
  name: "discord_rest_rate_limited_total",
  help: "Respuestas 429 de la API REST de Discord.",
  labelNames: ["global"],
  registers: [metricsRegistry],
});

const shardReconnects = new Counter({
  name: "discord_shard_reconnects_total",
  help: "Veces que un shard entró en estado 'reconnecting'.",
  labelNames: ["shardId"],
  registers: [metricsRegistry],
});

const shardDisconnects = new Counter({
  name: "discord_shard_disconnects_total",
  help: "Veces que un shard se desconectó (WebSocket cerrado).",
  labelNames: ["shardId"],
  registers: [metricsRegistry],
});

const shardResumes = new Counter({
  name: "discord_shard_resumes_total",
  help: "Veces que un shard resumió sesión tras una desconexión.",
  labelNames: ["shardId"],
  registers: [metricsRegistry],
});

let installed = false;

/** Idempotente — seguro llamarla aunque `createBotClient` se invoque una sola vez por proceso igual. */
export function installDiscordMetrics(client: Client): void {
  if (installed) return;
  installed = true;

  client.rest.on("rateLimited", (info) => {
    restRateLimited.inc({ global: String(info.global) });
  });

  client.on("shardReconnecting", (shardId) => {
    shardReconnects.inc({ shardId: String(shardId) });
  });
  client.on("shardDisconnect", (_closeEvent, shardId) => {
    shardDisconnects.inc({ shardId: String(shardId) });
  });
  client.on("shardResume", (shardId) => {
    shardResumes.inc({ shardId: String(shardId) });
  });
}
