import {
  Client,
  type ClientOptions,
  Events,
  GatewayIntentBits,
  Options,
  Partials,
} from "discord.js";
import { logger } from "../log.js";
import type { ModuleRegistry } from "../modules/registry.js";
import { registerInteractionRouter } from "./interactionRouter.js";

/** Intents mínimos del kernel (siempre activos). */
export const CORE_INTENTS: number[] = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.MessageContent,
];

/** Parsea `"0-3"`, `"0,2,4"` o `"0-3,7"` → lista ordenada de shard IDs. */
export function parseShardList(raw: string): number[] | null {
  const out = new Set<number>();
  for (const part of raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)) {
    const range = /^(\d+)-(\d+)$/.exec(part);
    if (range) {
      const from = Number(range[1]);
      const to = Number(range[2]);
      if (from > to) return null;
      for (let i = from; i <= to; i++) out.add(i);
    } else if (/^\d+$/.test(part)) {
      out.add(Number(part));
    } else {
      return null;
    }
  }
  return out.size > 0 ? [...out].sort((a, b) => a - b) : null;
}

/**
 * Config de shards:
 * - `SHARDS` (rango `0-3` / lista `0,2,4`) + `SHARD_TOTAL` → **multi-proceso**:
 *   este proceso atiende solo esos shards de un total de `SHARD_TOTAL`. Cada
 *   contenedor `gateway` atiende las interacciones de sus shards en local, sin
 *   routing entre procesos.
 * - `SHARD_COUNT=N` → N shards internos en **un** proceso.
 * - sin nada → `"auto"` (discord.js decide).
 */
function shardOptions(): {
  shards: number | number[] | "auto";
  shardCount?: number;
} {
  const shardsRaw = process.env.SHARDS?.trim();
  const totalRaw = process.env.SHARD_TOTAL?.trim();
  if (shardsRaw && totalRaw) {
    const list = parseShardList(shardsRaw);
    const total = Number(totalRaw);
    if (
      list &&
      Number.isInteger(total) &&
      total >= 1 &&
      list.every((s) => s >= 0 && s < total)
    ) {
      return {
        shards: list.length === 1 ? list[0]! : list,
        shardCount: total,
      };
    }
    logger.warn(
      `SHARDS/SHARD_TOTAL inválidos (SHARDS=${shardsRaw} SHARD_TOTAL=${totalRaw}) — usando 'auto'`,
    );
  }
  const countRaw = process.env.SHARD_COUNT?.trim();
  if (countRaw && countRaw !== "auto") {
    const n = Number(countRaw);
    if (Number.isFinite(n) && n >= 1) {
      return {
        shards: Array.from({ length: n }, (_, i) => i),
        shardCount: n,
      };
    }
  }
  return { shards: "auto" };
}

/**
 * Crea el Client Discord fusionando intents del core + módulos y enlaza el
 * interaction router. `registry.collect` + `registry.attach` los llama `index.ts`
 * (role-aware) después, porque el rol `api` no tiene Client.
 *
 * Sharding: ver `shardOptions()`. Multi-proceso = N contenedores `gateway`
 * con `SHARDS`/`SHARD_TOTAL` disjuntos + un `worker` único vía BullMQ.
 */
export function createBotClient(registry: ModuleRegistry): Client {
  const intentSet = new Set<number>([...CORE_INTENTS, ...registry.intents]);

  const { shards, shardCount } = shardOptions();
  const options: ClientOptions = {
    shards,
    ...(shardCount ? { shardCount } : {}),
    intents: [...intentSet],
    allowedMentions: { parse: [] },
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 200,
      PresenceManager: 0,
      GuildMemberManager: 200,
    }),
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: {
        interval: 3_600,
        lifetime: 1_800,
      },
    },
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.GuildMember,
      Partials.Reaction,
      Partials.User,
    ],
    failIfNotExists: false,
  };

  const client = new Client(options);

  client.once(Events.ClientReady, () => {
    logger.info(`Bot listo como ${client.user?.tag ?? "desconocido"}`);
  });
  client.on("error", (error) => {
    logger.error({ err: error }, "Discord client error:");
  });
  client.on("shardReconnecting", (id) => {
    logger.warn(`Reconectando shard ${id}…`);
  });
  client.on("shardResume", (id) => {
    logger.info(`Shard ${id} reanudado.`);
  });

  registerInteractionRouter(client, registry);

  return client;
}
