import pino from "pino";
import { describe, expect, it } from "vitest";
import { loggerOptions } from "./log.js";

/**
 * Fase 4 (§10.3, logging seguro): si algún call site futuro loguea `req`
 * completo, cookies/authorization/firma de Stripe/OAuth code-state nunca
 * deben llegar al sink. Reusa las opciones reales del logger (mismo redact
 * que producción) con un destino en memoria — evita depender del timing
 * asíncrono de la escritura real a stdout.
 */
function loggerWithCapture(): {
  logger: pino.Logger;
  lines: () => Record<string, unknown>[];
} {
  const chunks: string[] = [];
  const testLogger = pino(loggerOptions, {
    write: (chunk: string) => {
      chunks.push(chunk);
    },
  });
  return {
    logger: testLogger,
    lines: () =>
      chunks
        .join("")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>),
  };
}

describe("logger redaction (SEC logging seguro)", () => {
  it("strips cookie, authorization and stripe-signature headers nested under req", () => {
    const { logger, lines } = loggerWithCapture();
    logger.info(
      {
        req: {
          headers: {
            cookie: "tobot_session=super-secret",
            authorization: "Bearer secret-token",
            "stripe-signature": "t=1,v1=abcdef",
          },
        },
      },
      "test",
    );
    const [entry] = lines();
    const req = entry?.req as { headers: Record<string, unknown> } | undefined;
    const headers = req?.headers ?? {};
    expect(headers.cookie).toBeUndefined();
    expect(headers.authorization).toBeUndefined();
    expect(headers["stripe-signature"]).toBeUndefined();
  });

  it("strips OAuth code/state from req.query but keeps unrelated fields", () => {
    const { logger, lines } = loggerWithCapture();
    logger.info(
      { req: { query: { code: "abc123", state: "xyz789", other: "kept" } } },
      "test",
    );
    const [entry] = lines();
    const req = entry?.req as { query: Record<string, unknown> } | undefined;
    const query = req?.query ?? {};
    expect(query.code).toBeUndefined();
    expect(query.state).toBeUndefined();
    expect(query.other).toBe("kept");
  });
});
