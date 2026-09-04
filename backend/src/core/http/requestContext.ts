import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export interface RequestStore {
  requestId: string;
}

export const requestContext = new AsyncLocalStorage<RequestStore>();

/**
 * Un cliente controla este header por completo. Sin límite de longitud ni
 * charset, un valor hostil (binario, saltos de línea, kilobytes) termina
 * escrito tal cual en cada línea de log de la request (mixin de pino) —
 * inyección/ruido de logs. Acotado a algo que cabe en un UUID/nombre de traza.
 */
const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;

/** Propaga x-request-id a logs (mixin de pino) y a la respuesta. */
export function requestIdMiddleware(): RequestHandler {
  return (req, res, next) => {
    const incoming = req.headers["x-request-id"];
    const requestId =
      typeof incoming === "string" && REQUEST_ID_RE.test(incoming)
        ? incoming
        : randomUUID();
    res.setHeader("x-request-id", requestId);
    requestContext.run({ requestId }, () => next());
  };
}
