/**
 * Barrel del esquema Drizzle. Fase 7 (MAINT-01): las tablas viven partidas
 * por bounded context bajo `schema/*.ts` — este archivo solo reexporta.
 * `drizzle.config.ts` sigue apuntando a `./src/db/schema.ts`: drizzle-kit
 * resuelve los `export *` igual que cualquier import y ve todas las tablas.
 *
 * `guildSettings` (en `schema/core.ts`) es la única dependencia compartida
 * entre bounded contexts — casi todas las tablas tienen una FK a
 * `guildSettings.guildId`. El resto de referencias cruzadas (p. ej.
 * `voiceRooms.generatorId → voiceRoomGenerators.id`) quedan dentro del mismo
 * archivo de contexto.
 */

export * from "./schema/actionLogs.js";
export * from "./schema/antiRaid.js";
export * from "./schema/auth.js";
export * from "./schema/autoDelete.js";
export * from "./schema/autoMod.js";
export * from "./schema/autoReplies.js";
export * from "./schema/autoroles.js";
export * from "./schema/billing.js";
export * from "./schema/botProfile.js";
export * from "./schema/canvasEvents.js";
export * from "./schema/core.js";
export * from "./schema/customCommands.js";
export * from "./schema/economy.js";
export * from "./schema/forms.js";
export * from "./schema/giveaways.js";
export * from "./schema/levels.js";
export * from "./schema/moderation.js";
export * from "./schema/reminders.js";
export * from "./schema/runtime.js";
export * from "./schema/scheduledMessages.js";
export * from "./schema/starboard.js";
export * from "./schema/streamAlerts.js";
export * from "./schema/tickets.js";
export * from "./schema/uploads.js";
export * from "./schema/voiceRooms.js";
export * from "./schema/welcome.js";
