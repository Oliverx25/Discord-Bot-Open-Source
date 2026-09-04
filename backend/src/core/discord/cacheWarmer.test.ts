import { EventEmitter } from "node:events";
import { Events } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cache, MemoryStore, setCacheStore } from "#core/cache/store.js";
import type { BotGateway } from "./botGateway.js";
import { installCacheWarmer } from "./cacheWarmer.js";
import { discordCacheKey } from "./discordCache.js";

function fakeGateway(over: Partial<BotGateway> = {}): BotGateway {
  return {
    getGuild: vi.fn(async () => ({
      id: "g1",
      name: "Guild One",
      iconUrl: null,
      boosterRoleId: null,
    })),
    listChannels: vi.fn(async () => [
      { id: "c1", name: "general", type: 0, parentId: null, position: 0 },
    ]),
    listRoles: vi.fn(async () => [
      {
        id: "r1",
        name: "Mod",
        color: 0,
        hexColor: "#000",
        position: 1,
        managed: false,
      },
    ]),
    listEmojis: vi.fn(async () => []),
    listStickers: vi.fn(async () => []),
    getBotProfile: vi.fn(async () => ({ guildId: "g1" })),
    ...over,
  } as unknown as BotGateway;
}

const flush = () => new Promise((r) => setImmediate(r));

beforeEach(() => {
  setCacheStore(new MemoryStore());
});

describe("cache warmer", () => {
  it("GuildUpdate reescribe disc:guild:<id> con el snapshot del gateway", async () => {
    const client = new EventEmitter() as unknown as import("discord.js").Client;
    const gw = fakeGateway();
    installCacheWarmer(client, gw);

    client.emit(Events.GuildUpdate, {}, { id: "g1" });
    await flush();

    expect(gw.getGuild).toHaveBeenCalledWith("g1");
    expect(await cache().get(discordCacheKey.guild("g1"))).toMatchObject({
      id: "g1",
      name: "Guild One",
    });
  });

  it("GuildRoleUpdate reescribe disc:roles:<guild>", async () => {
    const client = new EventEmitter() as unknown as import("discord.js").Client;
    const gw = fakeGateway();
    installCacheWarmer(client, gw);

    client.emit(Events.GuildRoleUpdate, {}, { guild: { id: "g1" } });
    await flush();

    expect(gw.listRoles).toHaveBeenCalledWith("g1");
    expect(await cache().get(discordCacheKey.roles("g1"))).toEqual([
      {
        id: "r1",
        name: "Mod",
        color: 0,
        hexColor: "#000",
        position: 1,
        managed: false,
      },
    ]);
  });

  it("GuildDelete borra las claves del guild", async () => {
    const client = new EventEmitter() as unknown as import("discord.js").Client;
    installCacheWarmer(client, fakeGateway());
    await cache().set(discordCacheKey.guild("g1"), { id: "g1" }, 60_000);

    client.emit(Events.GuildDelete, { id: "g1" });
    await flush();

    expect(await cache().get(discordCacheKey.guild("g1"))).toBeUndefined();
  });

  it("GuildCreate NO calienta durante el burst de arranque (client no ready)", async () => {
    const client = Object.assign(new EventEmitter(), {
      isReady: () => false,
    }) as unknown as import("discord.js").Client;
    const gw = fakeGateway();
    installCacheWarmer(client, gw);

    client.emit(Events.GuildCreate, { id: "g1" });
    await flush();

    expect(gw.listChannels).not.toHaveBeenCalled();
  });
});
