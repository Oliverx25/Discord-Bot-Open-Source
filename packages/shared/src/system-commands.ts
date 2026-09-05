/**
 * Catálogo central de slash commands nativos (única fuente de verdad UI + Discord).
 *
 * Partido por responsabilidad en `system-commands/*` (Fase 7, MAINT-01):
 * contratos, catálogo de datos, etiquetas por defecto y lógica de consulta.
 * Este archivo sigue siendo el punto de entrada público — reexporta todo —
 * así ningún importador existente cambia (`@adobos/shared` resuelve el
 * subpath `system-commands` a este archivo, no a un directorio).
 */

export * from "./system-commands/catalog.js";
export * from "./system-commands/contracts.js";
export * from "./system-commands/defaults.js";
export * from "./system-commands/logic.js";
