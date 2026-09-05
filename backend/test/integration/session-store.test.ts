import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeTestDb, connectTestDb } from "./support/db.js";

/**
 * AUTH-01 (PLAN_FINAL_2026.md, §12.5): dos propiedades que un mock no puede
 * probar — "dos consumos concurrentes del mismo OAuth state, uno solo se
 * queda con el verifier" (antes era SELECT-luego-DELETE, con ventana de
 * carrera) y "la fila de sesión nunca guarda el token crudo".
 */

let consumeOauthState: (state: string) => Promise<string | null>;
let createSession: (input: {
  userId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  accessToken: string;
}) => Promise<string>;
let getSession: (sessionId: string) => Promise<{ userId: string } | null>;
let getDb: () => {
  insert: (t: unknown) => { values: (v: unknown) => Promise<unknown> };
  delete: (t: unknown) => { where: (w: unknown) => Promise<unknown> };
  select: () => {
    from: (t: unknown) => { where: (w: unknown) => Promise<unknown[]> };
  };
};
let oauthStates: unknown;
let panelUsers: unknown;
let panelSessions: unknown;

const testUserId = `test_${randomUUID().replaceAll("-", "")}`;

beforeAll(async () => {
  await connectTestDb();
  const store = await import("#core/auth/sessionStore.js");
  consumeOauthState = store.consumeOauthState;
  createSession = store.createSession;
  getSession = store.getSession;
  const client = await import("#db/client.js");
  getDb = client.getDb;
  const schema = await import("#db/schema.js");
  oauthStates = schema.oauthStates;
  panelUsers = schema.panelUsers;
  panelSessions = schema.panelSessions;

  await getDb()
    .insert(panelUsers)
    .values({
      userId: testUserId,
      username: "tester",
      globalName: null,
      avatar: null,
    });
}, 30_000);

afterAll(async () => {
  await getDb().delete(panelSessions).where(eq(panelSessions.userId, testUserId));
  await getDb().delete(panelUsers).where(eq(panelUsers.userId, testUserId));
  await closeTestDb();
});

// biome-ignore lint/suspicious/noExplicitAny: helper de test sobre Drizzle tipado dinámicamente arriba.
const table = (t: unknown) => t as any;

describe("consumeOauthState — atomicidad real contra Postgres (AUTH-01)", () => {
  it("dos consumos concurrentes del mismo state: exactamente uno se queda con el verifier", async () => {
    const state = `state_${randomUUID()}`;
    await getDb()
      .insert(oauthStates)
      .values({
        state,
        codeVerifier: "verifier-xyz",
        expiresAt: new Date(Date.now() + 60_000),
      });

    const [a, b] = await Promise.all([
      consumeOauthState(state),
      consumeOauthState(state),
    ]);
    const winners = [a, b].filter((v) => v !== null);
    expect(winners).toEqual(["verifier-xyz"]);

    // Ya no queda fila — consumida (por cualquiera de los dos).
    const second = await consumeOauthState(state);
    expect(second).toBeNull();
  });
});

describe("createSession / getSession — la fila nunca guarda el token crudo (AUTH-01)", () => {
  it("getSession funciona con el token crudo devuelto por createSession", async () => {
    const raw = await createSession({
      userId: testUserId,
      username: "tester",
      globalName: null,
      avatar: null,
      accessToken: "access-token-plain",
    });

    const session = await getSession(raw);
    expect(session?.userId).toBe(testUserId);

    const rows = (await getDb()
      .select()
      .from(table(panelSessions))
      .where(eq(table(panelSessions).userId, testUserId))) as Array<{
      id: string;
    }>;
    expect(rows).toHaveLength(1);
    // La fila NUNCA guarda el token crudo tal cual.
    expect(rows[0]?.id).not.toBe(raw);
    expect(rows[0]?.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("un token con un solo carácter distinto no encuentra la sesión", async () => {
    const raw = await createSession({
      userId: testUserId,
      username: "tester",
      globalName: null,
      avatar: null,
      accessToken: "access-token-plain-2",
    });
    const tampered = `${raw.slice(0, -1)}${raw.at(-1) === "a" ? "b" : "a"}`;
    expect(await getSession(tampered)).toBeNull();
    expect(await getSession(raw)).not.toBeNull();
  });
});
