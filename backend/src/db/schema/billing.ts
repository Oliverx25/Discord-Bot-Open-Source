import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Usuario Discord ↔ customer de Stripe. El portal y checkout reutilizan este id.
 */
export const billingCustomers = pgTable("billing_customers", {
  userId: text().primaryKey(),
  // Nombre de constraint explícito: con `casing` drizzle-kit lo derivaría del
  // key JS (…stripeCustomerId_unique) y no del nombre de columna resuelto.
  stripeCustomerId: text()
    .notNull()
    .unique("billing_customers_stripe_customer_id_unique"),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Suscripción de un usuario Discord. Stripe (webhook) rellena status/periodo.
 * `can(guildId, feature)` no consulta esta tabla: lee `guild_entitlements`.
 */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: text().notNull(),
    stripeCustomerId: text(),
    stripeSubscriptionId: text().unique(
      "subscriptions_stripe_subscription_id_unique",
    ),
    stripePriceId: text(),
    tier: text().notNull().default("pro"),
    /** active | trialing | past_due | paused | canceled | unpaid */
    status: text().notNull().default("active"),
    currentPeriodEnd: timestamp({
      withTimezone: true,
      mode: "date",
    }),
    cancelAt: timestamp({ withTimezone: true, mode: "date" }),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("idx_subscriptions_user").on(table.userId)],
);

/**
 * Plan efectivo por servidor. Fuente de verdad de `can()` / `limit()`.
 * Sin fila = free. Stripe (0.12) actualiza esta tabla, nunca se consulta en caliente.
 */
export const guildEntitlements = pgTable(
  "guild_entitlements",
  {
    guildId: text().primaryKey(),
    subscriptionId: integer().references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    tier: text().notNull().default("free"),
    assignedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_guild_entitlements_subscription").on(table.subscriptionId),
  ],
);

/**
 * Inbox de eventos Stripe (BILL-01). `eventId` como PK es el claim atómico:
 * `INSERT ... ON CONFLICT DO NOTHING` decide quién procesa. `status` +
 * `attempts` + `lastError` permiten reconciliar los que se quedan en
 * `pending` (crash entre claim y processed) o `failed` (reintento con backoff).
 */
export const webhookEvents = pgTable("webhook_events", {
  eventId: text().primaryKey(),
  eventType: text().notNull(),
  /** ID del objeto Stripe (subscription/invoice/checkout session) para reconciliar sin releer el payload. */
  objectId: text(),
  /** pending | processed | failed. */
  status: text().notNull().default("pending"),
  attempts: integer().notNull().default(0),
  // `.defaultNow()` (DEFAULT SQL, no `$defaultFn` de solo-Drizzle): la columna
  // se agrega a una tabla ya existente — sin default de base de datos, el
  // ALTER TABLE ... NOT NULL falla en cualquier entorno con filas previas.
  receivedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  /** Solo se fija cuando status = processed. */
  processedAt: timestamp({ withTimezone: true, mode: "date" }),
  lastError: text(),
});

export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type GuildEntitlementRow = typeof guildEntitlements.$inferSelect;
export type BillingCustomerRow = typeof billingCustomers.$inferSelect;
export type WebhookEventRow = typeof webhookEvents.$inferSelect;
