import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeTestDb, connectTestDb } from "./support/db.js";

/**
 * BILL-01 (PLAN_FINAL_2026.md): la propiedad que importa —"dos entregas
 * concurrentes del mismo evento producen un solo ganador"— no se puede
 * probar mockeando Drizzle (solo demostraría que el código llama los
 * métodos en orden, no que Postgres serializa el `INSERT ... ON CONFLICT`
 * de verdad). Corre contra el Postgres real de `docker compose up` (dev).
 */

let claimWebhookEvent: (
  eventId: string,
  eventType: string,
  objectId: string | null,
) => Promise<{ kind: string }>;
let getDb: () => {
  select: () => {
    from: (t: unknown) => { where: (w: unknown) => Promise<unknown[]> };
  };
  update: (t: unknown) => {
    set: (v: unknown) => { where: (w: unknown) => Promise<unknown> };
  };
  delete: (t: unknown) => { where: (w: unknown) => Promise<unknown> };
};
let webhookEvents: unknown;

beforeAll(async () => {
  await connectTestDb();
  const inbox = await import("#modules/billing/inbox.js");
  claimWebhookEvent = inbox.claimWebhookEvent;
  const client = await import("#db/client.js");
  getDb = client.getDb;
  const schema = await import("#db/schema.js");
  webhookEvents = schema.webhookEvents;
}, 30_000);

afterAll(async () => {
  await closeTestDb();
});

function testEventId(): string {
  return `evt_test_${randomUUID()}`;
}

// biome-ignore lint/suspicious/noExplicitAny: helpers de test sobre Drizzle tipado dinámicamente arriba.
const table = () => webhookEvents as any;

describe("claimWebhookEvent — atomicidad real contra Postgres (BILL-01)", () => {
  it("dos claims concurrentes del mismo evento producen exactamente un ganador", async () => {
    const eventId = testEventId();
    try {
      const [a, b] = await Promise.all([
        claimWebhookEvent(eventId, "checkout.session.completed", "obj_1"),
        claimWebhookEvent(eventId, "checkout.session.completed", "obj_1"),
      ]);
      const kinds = [a.kind, b.kind].sort();
      expect(kinds).toEqual(["claimed", "in_flight"]);

      const rows = (await getDb()
        .select()
        .from(table())
        .where(eq(table().eventId, eventId))) as Array<{ attempts: number }>;
      expect(rows).toHaveLength(1);
      expect(rows[0]?.attempts).toBe(1);
    } finally {
      await getDb().delete(table()).where(eq(table().eventId, eventId));
    }
  });

  it("tras marcar processed, una entrega repetida es 'duplicate' (no reprocesa)", async () => {
    const eventId = testEventId();
    try {
      const first = await claimWebhookEvent(eventId, "invoice.paid", "obj_2");
      expect(first.kind).toBe("claimed");

      await getDb()
        .update(table())
        .set({ status: "processed", processedAt: new Date() })
        .where(eq(table().eventId, eventId));

      const second = await claimWebhookEvent(eventId, "invoice.paid", "obj_2");
      expect(second.kind).toBe("duplicate");
    } finally {
      await getDb().delete(table()).where(eq(table().eventId, eventId));
    }
  });

  it("un evento 'pending' sin marcar processed nunca se reprocesa inline (in_flight)", async () => {
    const eventId = testEventId();
    try {
      const first = await claimWebhookEvent(eventId, "invoice.paid", "obj_3");
      expect(first.kind).toBe("claimed");
      const second = await claimWebhookEvent(eventId, "invoice.paid", "obj_3");
      expect(second.kind).toBe("in_flight");
    } finally {
      await getDb().delete(table()).where(eq(table().eventId, eventId));
    }
  });
});
