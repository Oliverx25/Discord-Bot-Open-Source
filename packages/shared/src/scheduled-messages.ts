/**
 * Contratos Scheduled Messages (horario persistido + embeds).
 *
 * Partido por responsabilidad en `scheduled-messages/*` (Fase 7, MAINT-01):
 * contratos, defaults, normalización/formato y el motor de cálculo de
 * disparo civil por zona horaria. Este archivo sigue siendo el punto de
 * entrada público — reexporta todo — así ningún importador existente
 * cambia (`@adobos/shared` resuelve el subpath `scheduled-messages` a
 * este archivo, no a un directorio).
 */

export * from "./scheduled-messages/contracts.js";
export * from "./scheduled-messages/defaults.js";
export * from "./scheduled-messages/normalize.js";
export * from "./scheduled-messages/schedule.js";
