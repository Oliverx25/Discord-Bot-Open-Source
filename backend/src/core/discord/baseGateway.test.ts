import { beforeEach, describe, expect, it, vi } from "vitest";

const restCalls = {
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
};

let token: string | undefined = "tok-123";

vi.mock("#core/env.js", () => ({
  env: () => ({ DISCORD_TOKEN: token, DISCORD_CLIENT_ID: "bot-123" }),
}));

vi.mock("./rest.js", () => ({
  getDiscordRest: () => restCalls,
}));

// Se importa después de los mocks (los write viven en BaseGateway; RestGateway
// es el adaptador concreto más fino, así que sirve para ejercitar la base).
const { RestGateway } = await import("./restGateway.js");
const { BotGatewayError } = await import("./botGateway.js");
const { setCacheStore, MemoryStore } = await import("#core/cache/store.js");

function discordErr(code: number): Error {
  return Object.assign(new Error("discord"), { code });
}

beforeEach(() => {
  token = "tok-123";
  setCacheStore(new MemoryStore());
});

describe("BaseGateway — escrituras REST", () => {
  it("sendMessage publica en channelMessages y devuelve { messageId, channelId }", async () => {
    restCalls.post.mockResolvedValueOnce({ id: "msg-1", channel_id: "c1" });
    const gw = new RestGateway();
    const res = await gw.sendMessage("g1", "c1", { content: "hola" });
    expect(res).toEqual({ messageId: "msg-1", channelId: "c1" });
    expect(restCalls.post).toHaveBeenCalledWith(
      expect.stringContaining("/channels/c1/messages"),
      expect.objectContaining({
        body: expect.objectContaining({ content: "hola" }),
      }),
    );
  });

  it("editMessage devuelve { orphaned: true } ante 10008", async () => {
    restCalls.patch.mockRejectedValueOnce(discordErr(10008));
    const gw = new RestGateway();
    await expect(gw.editMessage("g1", "c1", "m1", {})).resolves.toEqual({
      orphaned: true,
    });
  });

  it("deleteMessage devuelve { orphaned: true } ante 10008", async () => {
    restCalls.delete.mockRejectedValueOnce(discordErr(10008));
    const gw = new RestGateway();
    await expect(gw.deleteMessage("g1", "c1", "m1")).resolves.toEqual({
      orphaned: true,
    });
  });

  it("sin DISCORD_TOKEN lanza BotGatewayError 503 NO_DISCORD_TOKEN", async () => {
    token = undefined;
    const gw = new RestGateway();
    await expect(
      gw.sendMessage("g1", "c1", { content: "x" }),
    ).rejects.toMatchObject({ status: 503, code: "NO_DISCORD_TOKEN" });
    expect(BotGatewayError).toBeTypeOf("function");
  });
});

describe("RestGateway — caché read-through + invalidación", () => {
  it("resuelve @me al ID del bot al leer su perfil en un guild", async () => {
    restCalls.get.mockImplementation(async (route: string) => {
      if (route.includes("/members/")) {
        return {
          user: {
            id: "bot-123",
            username: "tobot",
            discriminator: "0",
            avatar: null,
          },
          roles: [],
          joined_at: "2026-01-01T00:00:00.000Z",
        };
      }
      if (route.endsWith("/roles")) return [];
      return { id: "g1", name: "Guild One", icon: null };
    });

    const gw = new RestGateway();
    await expect(gw.getBotProfile("g1")).resolves.toMatchObject({
      guildId: "g1",
      username: "tobot",
    });
    expect(restCalls.get).toHaveBeenCalledWith(
      expect.stringContaining("/guilds/g1/members/bot-123"),
    );
  });

  it("listChannels cachea: la 2ª llamada no vuelve a pegar a REST", async () => {
    restCalls.get.mockResolvedValue([
      { id: "c1", name: "general", type: 0, position: 1 },
    ]);
    const gw = new RestGateway();
    const a = await gw.listChannels("g1");
    const b = await gw.listChannels("g1");
    expect(b).toEqual(a);
    expect(restCalls.get).toHaveBeenCalledTimes(1);
  });

  it("createRole invalida disc:roles:<guild> → listRoles vuelve a REST", async () => {
    restCalls.get.mockResolvedValue([
      { id: "r1", name: "Mod", color: 0, position: 2, permissions: "0" },
    ]);
    restCalls.post.mockResolvedValueOnce({
      id: "r2",
      name: "New",
      color: 0,
      position: 0,
      permissions: "0",
      managed: false,
      hoist: false,
      mentionable: false,
    });
    const gw = new RestGateway();
    await gw.listRoles("g1"); // get #1 → cachea
    await gw.listRoles("g1"); // hit
    expect(restCalls.get).toHaveBeenCalledTimes(1);
    await gw.createRole("g1", {
      name: "New",
      color: 0,
      permissions: 0n,
      hoist: false,
      mentionable: false,
      position: 0,
    });
    await gw.listRoles("g1"); // get #2 → miss tras invalidación
    expect(restCalls.get).toHaveBeenCalledTimes(2);
  });

  it("deleteChannel invalida el canal y la lista", async () => {
    restCalls.get.mockResolvedValue([
      { id: "c1", name: "general", type: 0, position: 1 },
    ]);
    restCalls.delete.mockResolvedValue(undefined);
    const gw = new RestGateway();
    await gw.listChannels("g1");
    expect(restCalls.get).toHaveBeenCalledTimes(1);
    await gw.deleteChannel("g1", "c1");
    await gw.listChannels("g1");
    expect(restCalls.get).toHaveBeenCalledTimes(2);
  });
});
