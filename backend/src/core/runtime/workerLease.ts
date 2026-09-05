import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "#db/client.js";
import { logger } from "../log.js";
import { isWorkerLeader, setWorkerLeader } from "./index.js";

/**
 * OPS-01 (PLAN_FINAL_2026.md, §12.2): el advisory lock anterior vivía en una
 * conexión dedicada de sesión — pero postgres.js reconecta de forma
 * transparente ante un corte de red, y un advisory lock es de sesión: tras
 * un reconnect silencioso el proceso sigue creyendo `isWorkerLeader() ===
 * true` aunque Postgres ya liberó el lock real. Un lease con expiración y
 * fencing token no depende de la continuidad de una conexión TCP: se
 * renueva por fila, con `now()` como fuente de verdad, y cualquier réplica
 * puede reclamarlo en cuanto expira.
 *
 * Los módulos que gatean crons con `isWorkerLeader()` dentro de su propio
 * tick (giveaways, reminders, scheduled-messages, auto-delete, action-logs,
 * stream-alerts) ya se auto-corrigen solos en el siguiente tick cuando el
 * valor cambia — no hace falta tocarlos. Los que solo miran el valor una vez
 * al boot (economy, billing) se ajustaron para re-chequear en cada tick.
 */

const LEASE_NAME = "worker";
const TTL_MS = 15_000;
const RENEW_INTERVAL_MS = 5_000;

const holderId = randomUUID();
let fencingTokenValue = 0;
let timer: ReturnType<typeof setInterval> | null = null;

/** Fencing token del lease vigente (solo válido si `isWorkerLeader()` es true). */
export function currentFencingToken(): number {
  return fencingTokenValue;
}

export interface AcquireResult {
  acquired: boolean;
  fencingToken: number;
}

/**
 * Primitiva atómica, parametrizada por nombre/dueño/TTL — exportada aparte
 * de `tick()` (que fija LEASE_NAME/holderId de proceso) para poder probar la
 * carrera real con dos "dueños" distintos sin pelear contra el singleton de
 * `isWorkerLeader()`. Ver `test/integration/worker-lease.test.ts`.
 */
export async function acquireOrRenewLease(
  name: string,
  holder: string,
  ttlMs: number,
): Promise<AcquireResult> {
  // `execute(sql\`...\`)` es un bind crudo de postgres.js, no pasa por el
  // mapeo de columna de Drizzle — un `Date` sin serializar revienta el
  // binding (espera string/Buffer). ISO 8601 lo castea bien a timestamptz.
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const rows = (await getDb().execute(sql`
    INSERT INTO worker_leases (name, holder, fencing_token, expires_at)
    VALUES (${name}, ${holder}, 1, ${expiresAt})
    ON CONFLICT (name) DO UPDATE SET
      holder = EXCLUDED.holder,
      fencing_token = worker_leases.fencing_token +
        CASE WHEN worker_leases.holder = EXCLUDED.holder THEN 0 ELSE 1 END,
      expires_at = EXCLUDED.expires_at
    WHERE worker_leases.expires_at < now() OR worker_leases.holder = EXCLUDED.holder
    RETURNING fencing_token AS "fencingToken"
  `)) as unknown as Array<{ fencingToken: number | string }>;

  const row = rows[0];
  if (!row) return { acquired: false, fencingToken: fencingTokenValue };
  return { acquired: true, fencingToken: Number(row.fencingToken) };
}

async function tick(): Promise<void> {
  const was = isWorkerLeader();
  try {
    const result = await acquireOrRenewLease(LEASE_NAME, holderId, TTL_MS);
    fencingTokenValue = result.fencingToken;
    setWorkerLeader(result.acquired);
    if (result.acquired && !was) {
      logger.info(
        { holderId, fencingToken: result.fencingToken },
        "worker lease: liderazgo adquirido",
      );
    } else if (!result.acquired && was) {
      logger.warn({ holderId }, "worker lease: liderazgo perdido");
    }
  } catch (error: unknown) {
    // No se pudo ni intentar (Postgres inalcanzable) — más seguro asumir que
    // NO se lidera que arriesgar doble-ejecución de crons con datos viejos.
    setWorkerLeader(false);
    if (was) {
      logger.warn(
        { err: error, holderId },
        "worker lease: error renovando, liderazgo revocado por seguridad",
      );
    }
  }
}

/**
 * Primer intento síncrono (igual que el lock anterior: `registerJobs()` de
 * cada módulo debe ver el resultado real al registrarse) y arranca la
 * renovación periódica.
 */
export async function startWorkerLeadershipLease(): Promise<void> {
  if (timer) return;
  await tick();
  timer = setInterval(() => void tick(), RENEW_INTERVAL_MS);
  timer.unref?.();
}

/** Libera ya el lease si somos el dueño — así un standby no espera el TTL completo. */
export async function stopWorkerLeadershipLease(): Promise<void> {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (isWorkerLeader()) {
    try {
      await getDb().execute(sql`
        UPDATE worker_leases SET expires_at = now()
        WHERE name = ${LEASE_NAME} AND holder = ${holderId}
      `);
    } catch {
      // best-effort — si Postgres ya no responde, el TTL lo libera solo.
    }
  }
  setWorkerLeader(false);
}
