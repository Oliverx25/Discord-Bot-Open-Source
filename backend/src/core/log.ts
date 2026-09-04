import pino from "pino";
import { requestContext } from "./http/requestContext.js";

const isProd = process.env.NODE_ENV === "production";
/** Pretty solo con LOG_PRETTY=1. En Compose (JSON) el transport de pino-pretty rompe el arranque. */
const pretty = !isProd && process.env.LOG_PRETTY === "1";

/**
 * Opciones base sin el `transport` de pretty-print, exportadas aparte para
 * que los tests puedan construir un logger equivalente con un destino propio
 * (in-memory) y así verificar la redacción real sin depender del timing
 * asíncrono de la escritura a stdout. Ver `log.test.ts`.
 */
export const loggerOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  base: { service: "adobos" },
  mixin() {
    return requestContext.getStore() ?? {};
  },
  // Defensa en profundidad: hoy ningún call site loguea `req`/`err.config`
  // completos, pero si alguno empieza a hacerlo estos campos nunca deben
  // aparecer — cookies/authorization, firma de Stripe, y query de OAuth
  // (`code`/`state`) en cualquier profundidad (`*` = comodín de un nivel).
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "req.headers['stripe-signature']",
      "req.query.code",
      "req.query.state",
      "*.headers.cookie",
      "*.headers.authorization",
      "*.headers['stripe-signature']",
    ],
    remove: true,
  },
};

export const logger = pino({
  ...loggerOptions,
  ...(pretty
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }
    : {}),
});
