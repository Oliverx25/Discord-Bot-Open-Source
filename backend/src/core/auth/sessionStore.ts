import { and, eq, lt } from "drizzle-orm";
import { getDb, one } from "#db/client.js";
import { oauthStates, panelSessions, panelUsers } from "#db/schema.js";
import { encryptSecret, hashSessionId, randomToken } from "./crypto.js";
import {
  OAUTH_STATE_TTL_MS,
  type PanelUser,
  SESSION_TTL_MS,
  type StoredSession,
} from "./types.js";

function avatarUrl(userId: string, avatar: string | null): string | null {
  if (!avatar) return null;
  const ext = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${ext}`;
}

export function toPanelUser(row: {
  userId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}): PanelUser {
  return {
    id: row.userId,
    username: row.username,
    globalName: row.globalName,
    avatar: row.avatar,
    avatarUrl: avatarUrl(row.userId, row.avatar),
  };
}

export async function upsertPanelUser(input: {
  userId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}): Promise<void> {
  const now = new Date();
  // AUTH-01: select-then-insert/update era check-then-act — dos callbacks de
  // OAuth para el mismo usuario a la vez podían pisarse (o uno fallar con PK
  // duplicada si ambos veían "no existe"). Un solo INSERT ... ON CONFLICT es
  // atómico.
  await getDb()
    .insert(panelUsers)
    .values({
      userId: input.userId,
      username: input.username,
      globalName: input.globalName,
      avatar: input.avatar,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: panelUsers.userId,
      set: {
        username: input.username,
        globalName: input.globalName,
        avatar: input.avatar,
        updatedAt: now,
      },
    });
}

export async function createOauthState(codeVerifier: string): Promise<string> {
  const state = randomToken(32);
  await getDb()
    .insert(oauthStates)
    .values({
      state,
      flow: "login",
      codeVerifier,
      expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
    });
  return state;
}

export async function consumeOauthState(state: string): Promise<string | null> {
  // AUTH-01: SELECT-luego-DELETE dejaba una ventana donde dos callbacks
  // concurrentes con el MISMO `state` (replay, o dos tabs) podían ver la fila
  // como válida antes de que ninguno la borrara — el mismo `state`/PKCE
  // verifier se consumía dos veces. `DELETE ... RETURNING` reclama la fila
  // atómicamente: como mucho una llamada se queda con el verifier.
  const row = await one(
    getDb()
      .delete(oauthStates)
      .where(and(eq(oauthStates.state, state), eq(oauthStates.flow, "login")))
      .returning(),
  );
  if (!row) return null;
  return takeOauthVerifier(row, Date.now());
}

export async function createBotInstallState(input: {
  codeVerifier: string;
  sessionIdHash: string;
  requestedGuildId: string | null;
}): Promise<string> {
  const state = randomToken(32);
  await getDb()
    .insert(oauthStates)
    .values({
      state,
      flow: "bot_install",
      codeVerifier: input.codeVerifier,
      sessionIdHash: input.sessionIdHash,
      requestedGuildId: input.requestedGuildId,
      expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
    });
  return state;
}

export async function consumeBotInstallState(state: string): Promise<{
  codeVerifier: string;
  sessionIdHash: string;
  requestedGuildId: string | null;
  expiresAt: Date;
} | null> {
  const row = await one(
    getDb()
      .delete(oauthStates)
      .where(
        and(eq(oauthStates.state, state), eq(oauthStates.flow, "bot_install")),
      )
      .returning(),
  );
  if (!row?.sessionIdHash) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  return {
    codeVerifier: row.codeVerifier,
    sessionIdHash: row.sessionIdHash,
    requestedGuildId: row.requestedGuildId,
    expiresAt: row.expiresAt,
  };
}

/** Consume-once: la fila ya se borró; si estaba caducada no vale. */
export function takeOauthVerifier(
  row: { codeVerifier: string; expiresAt: Date },
  nowMs: number,
): string | null {
  if (row.expiresAt.getTime() <= nowMs) return null;
  return row.codeVerifier;
}

/** Devuelve el token crudo (va en la cookie); la fila guarda solo su hash. */
export async function createSession(input: {
  userId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  accessToken: string;
  refreshToken?: string | null;
  accessExpiresAt?: Date | null;
}): Promise<string> {
  const raw = randomToken(32);
  await getDb()
    .insert(panelSessions)
    .values({
      id: hashSessionId(raw),
      userId: input.userId,
      accessTokenEnc: encryptSecret(input.accessToken),
      refreshTokenEnc: input.refreshToken
        ? encryptSecret(input.refreshToken)
        : null,
      accessExpiresAt: input.accessExpiresAt ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
  return raw;
}

/**
 * `sessionId` acá es `StoredSession.id` (ya el hash — viene de un
 * `getSession()` previo), a diferencia de `getSession`/`deleteSession` desde
 * `oauth.ts`, que reciben el token crudo de la cookie y lo hashean ellos.
 */
export async function updateSessionTokens(
  sessionId: string,
  input: {
    accessToken: string;
    refreshToken?: string | null;
    accessExpiresAt?: Date | null;
  },
): Promise<void> {
  const patch: {
    accessTokenEnc: string;
    refreshTokenEnc?: string | null;
    accessExpiresAt?: Date | null;
  } = {
    accessTokenEnc: encryptSecret(input.accessToken),
  };
  if (input.refreshToken !== undefined) {
    patch.refreshTokenEnc = input.refreshToken
      ? encryptSecret(input.refreshToken)
      : null;
  }
  if (input.accessExpiresAt !== undefined) {
    patch.accessExpiresAt = input.accessExpiresAt;
  }
  await getDb()
    .update(panelSessions)
    .set(patch)
    .where(eq(panelSessions.id, sessionId));
}

/** `sessionId` es el token crudo de la cookie — se hashea acá antes de consultar. */
export async function getSession(
  sessionId: string,
): Promise<StoredSession | null> {
  const hashed = hashSessionId(sessionId);
  const session = await one(
    getDb()
      .select()
      .from(panelSessions)
      .where(eq(panelSessions.id, hashed))
      .limit(1),
  );
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await getDb().delete(panelSessions).where(eq(panelSessions.id, hashed));
    }
    return null;
  }
  const user = await one(
    getDb()
      .select()
      .from(panelUsers)
      .where(eq(panelUsers.userId, session.userId))
      .limit(1),
  );
  if (!user) return null;
  return {
    id: session.id,
    userId: user.userId,
    username: user.username,
    globalName: user.globalName,
    avatar: user.avatar,
    accessTokenEnc: session.accessTokenEnc,
    refreshTokenEnc: session.refreshTokenEnc,
    accessExpiresAt: session.accessExpiresAt,
    expiresAt: session.expiresAt,
  };
}

/** Espera el hash (`StoredSession.id`). `oauth.ts` hashea el cookie crudo antes de llamar. */
export async function deleteSession(sessionId: string): Promise<void> {
  await getDb().delete(panelSessions).where(eq(panelSessions.id, sessionId));
}

export async function pruneExpiredSessions(): Promise<void> {
  const now = new Date();
  await getDb().delete(oauthStates).where(lt(oauthStates.expiresAt, now));
  await getDb().delete(panelSessions).where(lt(panelSessions.expiresAt, now));
}

let pruneTimer: ReturnType<typeof setInterval> | null = null;

/** Limpieza periódica; no va en el hot path de getSession. */
export function startSessionPruneJob(): void {
  if (pruneTimer) return;
  void pruneExpiredSessions();
  pruneTimer = setInterval(
    () => {
      void pruneExpiredSessions();
    },
    60 * 60 * 1000,
  );
  pruneTimer.unref();
}

export function stopSessionPruneJob(): void {
  if (!pruneTimer) return;
  clearInterval(pruneTimer);
  pruneTimer = null;
}
