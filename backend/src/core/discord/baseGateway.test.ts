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
  env: () => ({ DISCORD_TOKEN: token }),
}));

vi.mock("./rest.js", () => ({
  getDiscordRest: () => restCalls,
}));

// Se importa después de los mocks (los write viven en BaseGateway; RestGateway
// es el adaptador concreto más fino, así que sirve para ejercitar la base).
const { RestGateway } = await import("./restGateway.js");
const { BotGatewayError } = await import("./botGateway.js");

function discordErr(code: number): Error {
  return Object.assign(new Error("discord"), { code });
}

beforeEach(() => {
  token = "tok-123";
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
