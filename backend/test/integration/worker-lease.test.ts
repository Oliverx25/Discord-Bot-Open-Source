import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeTestDb, connectTestDb } from "./support/db.js";

/**
 * OPS-01 (PLAN_FINAL_2026.md, §12.2): el advisory lock de sesión perdía el
 * liderazgo en silencio ante un reconnect transparente de postgres.js. El
 * lease reemplaza esa dependencia de la conexión TCP por una fila con
 * expiración — las propiedades que importan (dos dueños compitiendo, uno
 * gana; expiración libera; renovación del mismo dueño no rota el fencing
 * token) solo se pueden probar contra Postgres real.
 *
 * Usa un nombre de lease único por test (no "worker") para no interferir con
 * el proceso `worker` real si el stack de desarrollo está corriendo.
 */

let acquireOrRenewLease: (
  name: string,
  holder: string,
  ttlMs: number,
) => Promise<{ acquired: boolean; fencingToken: number }>;
let getDb: () => {
  delete: (t: unknown) => { where: (w: unknown) => Promise<unknown> };
};
let workerLeases: unknown;

beforeAll(async () => {
  await connectTestDb();
  const lease = await import("#core/runtime/workerLease.js");
  acquireOrRenewLease = lease.acquireOrRenewLease;
  const client = await import("#db/client.js");
  getDb = client.getDb;
  const schema = await import("#db/schema.js");
  workerLeases = schema.workerLeases;
}, 30_000);

afterAll(async () => {
  await closeTestDb();
});

// biome-ignore lint/suspicious/noExplicitAny: helper de test sobre Drizzle tipado dinámicamente arriba.
const table = () => workerLeases as any;

function leaseName(): string {
  return `test_${randomUUID()}`;
}

describe("acquireOrRenewLease — lease con fencing token (OPS-01)", () => {
  it("la primera adquisición gana y arranca en fencing token 1", async () => {
    const name = leaseName();
    try {
      const result = await acquireOrRenewLease(name, "holder-a", 15_000);
      expect(result).toEqual({ acquired: true, fencingToken: 1 });
    } finally {
      await getDb().delete(table()).where(eq(table().name, name));
    }
  });

  it("dos dueños distintos compitiendo por el mismo lease: exactamente uno gana", async () => {
    const name = leaseName();
    try {
      const [a, b] = await Promise.all([
        acquireOrRenewLease(name, "holder-a", 15_000),
        acquireOrRenewLease(name, "holder-b", 15_000),
      ]);
      const acquiredCount = [a.acquired, b.acquired].filter(Boolean).length;
      expect(acquiredCount).toBe(1);
    } finally {
      await getDb().delete(table()).where(eq(table().name, name));
    }
  });

  it("el mismo dueño renovando mantiene el fencing token (no rota)", async () => {
    const name = leaseName();
    try {
      const first = await acquireOrRenewLease(name, "holder-a", 15_000);
      const second = await acquireOrRenewLease(name, "holder-a", 15_000);
      expect(first.fencingToken).toBe(1);
      expect(second.fencingToken).toBe(1);
      expect(second.acquired).toBe(true);
    } finally {
      await getDb().delete(table()).where(eq(table().name, name));
    }
  });

  it("un dueño distinto no puede renovar un lease vigente de otro", async () => {
    const name = leaseName();
    try {
      await acquireOrRenewLease(name, "holder-a", 15_000);
      const stolen = await acquireOrRenewLease(name, "holder-b", 15_000);
      expect(stolen.acquired).toBe(false);
    } finally {
      await getDb().delete(table()).where(eq(table().name, name));
    }
  });

  it("un lease expirado puede reclamarlo otro dueño, y el fencing token sube", async () => {
    const name = leaseName();
    try {
      // TTL negativo -> expira al instante, sin esperar de verdad en el test.
      const first = await acquireOrRenewLease(name, "holder-a", -1000);
      expect(first.acquired).toBe(true);
      expect(first.fencingToken).toBe(1);

      const second = await acquireOrRenewLease(name, "holder-b", 15_000);
      expect(second.acquired).toBe(true);
      expect(second.fencingToken).toBe(2);
    } finally {
      await getDb().delete(table()).where(eq(table().name, name));
    }
  });
});
