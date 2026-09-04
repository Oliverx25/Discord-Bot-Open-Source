import type { LookupAddress } from "node:dns";
import dns from "node:dns";
import https from "node:https";
import { logger } from "../log.js";

/**
 * SEC-02 (PLAN_FINAL_2026.md): descarga de imágenes indicadas por un
 * guild/usuario del panel (fondo de welcome card, avatar de servidor del
 * bot, …). OWASP trata esto como caso directo de SSRF —
 * <https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html>.
 *
 * Toda descarga de una URL controlada por un guild debe pasar por
 * `safeImageFetch`, nunca por `fetch()` directo. Garantiza:
 * - solo HTTPS, sin credenciales en la URL;
 * - la IP a la que se conecta el socket es la misma que se validó (el
 *   `lookup` custom fija la conexión — sin ventana de DNS rebinding entre
 *   "resolver" y "conectar");
 * - bloqueo de loopback/link-local/privadas/multicast/rangos especiales,
 *   IPv4 e IPv6 (incluida la forma IPv4-mapped `::ffff:a.b.c.d`);
 *   redirects nunca se siguen automáticamente: cada salto se revalida
 *   íntegramente y hay un máximo de saltos;
 * - límite de tamaño con abort de streaming (no `arrayBuffer()` sin límite);
 * - `Content-Type` + magic bytes deben ser de imagen real;
 * - ni la URL completa ni el cuerpo se reflejan en logs — como mucho el host.
 */

export class SafeImageFetchError extends Error {
  constructor(
    message: string,
    readonly code: string,
    /** Para que el borde HTTP lo mapee directo (ver `isAppHttpError`). */
    readonly status: number = 400,
  ) {
    super(message);
    this.name = "SafeImageFetchError";
  }
}

export interface SafeImageFetchOptions {
  /** Bytes máximos a leer del cuerpo. Default 8 MiB. */
  maxBytes?: number;
  /** Presupuesto total (incluye redirects). Default 12s. */
  timeoutMs?: number;
  /** Saltos de redirect permitidos. Default 3. */
  maxRedirects?: number;
}

export interface SafeImageResult {
  buffer: Buffer;
  contentType: string;
}

const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_REDIRECTS = 3;

const IMAGE_MAGIC: readonly {
  type: string;
  bytes: number[];
  offset?: number;
}[] = [
  {
    type: "image/png",
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  // RIFF....WEBP: "WEBP" empieza en el byte 8, no en el 0.
  { type: "image/webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
];

export function sniffImageMagic(buf: Buffer): string | null {
  for (const sig of IMAGE_MAGIC) {
    const offset = sig.offset ?? 0;
    if (buf.length < offset + sig.bytes.length) continue;
    if (sig.bytes.every((b, i) => buf[offset + i] === b)) return sig.type;
  }
  return null;
}

// ---- Rangos IPv4/IPv6 bloqueados (loopback, privadas, link-local, multicast,
// especiales — RFC 1918, 5737, 3927, 4193, 4291, 6598, 6890). ----

function ipv4ToUint(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const v = Number(part);
    if (v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function inRangeV4(ipN: number, base: string, prefixBits: number): boolean {
  const baseN = ipv4ToUint(base);
  if (baseN === null) return false;
  const mask = prefixBits === 0 ? 0 : (~0 << (32 - prefixBits)) >>> 0;
  return (ipN & mask) === (baseN & mask);
}

const V4_BLOCKED_RANGES: readonly [string, number][] = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // privada
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local
  ["172.16.0.0", 12], // privada
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16], // privada
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reservado
  ["255.255.255.255", 32], // broadcast
];

/** Exportado para test unitario directo del rango — ver safeImageFetch.test.ts. */
export function isBlockedIPv4(ip: string): boolean {
  const n = ipv4ToUint(ip);
  if (n === null) return true; // no parseable -> no confiar
  return V4_BLOCKED_RANGES.some(([base, bits]) => inRangeV4(n, base, bits));
}

/** Exportado para test unitario directo del rango — ver safeImageFetch.test.ts. */
export function isBlockedIPv6(ipRaw: string): boolean {
  const ip = ipRaw.toLowerCase();
  if (ip === "::" || ip === "::1") return true; // unspecified / loopback
  const v4Mapped = ip.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Mapped?.[1]) return isBlockedIPv4(v4Mapped[1]);
  if (/^f[cd][0-9a-f]{2}:/.test(ip)) return true; // unique local fc00::/7
  if (/^fe[89ab][0-9a-f]:/.test(ip)) return true; // link-local fe80::/10
  if (ip.startsWith("ff")) return true; // multicast ff00::/8
  return false;
}

function isBlockedAddress(address: string, family: number): boolean {
  return family === 6 ? isBlockedIPv6(address) : isBlockedIPv4(address);
}

/**
 * `lookup` custom para `https.request`: resuelve A+AAAA, bloquea cualquier
 * registro privado/reservado ANTES de que exista un socket, y devuelve la
 * IP exacta a la que se conectará el request — así no hay ventana entre
 * "resolvimos y validamos" y "nos conectamos" (DNS rebinding).
 */
export function validatingLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (
    err: NodeJS.ErrnoException | null,
    address: string | LookupAddress[],
    family?: number,
  ) => void,
): void {
  dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
    if (err) {
      callback(err, "", 4);
      return;
    }
    if (!addresses || addresses.length === 0) {
      callback(
        Object.assign(new Error("DNS resolution returned no addresses"), {
          code: "ENOTFOUND",
        }),
        "",
        4,
      );
      return;
    }
    const blocked = addresses.find((a) =>
      isBlockedAddress(a.address, a.family),
    );
    if (blocked) {
      callback(
        new SafeImageFetchError(
          `Resolved address is private/reserved (IPv${blocked.family})`,
          "SSRF_BLOCKED_IP",
        ) as NodeJS.ErrnoException,
        "",
        4,
      );
      return;
    }
    if (options.all) {
      callback(null, addresses);
      return;
    }
    const chosen = addresses[0]!;
    callback(null, chosen.address, chosen.family);
  });
}

export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SafeImageFetchError("Malformed URL.", "INVALID_URL");
  }
  if (url.protocol !== "https:") {
    throw new SafeImageFetchError(
      "Only https:// image URLs are allowed.",
      "SCHEME_NOT_ALLOWED",
    );
  }
  if (url.username || url.password) {
    throw new SafeImageFetchError(
      "Credentials in the URL are not allowed.",
      "CREDENTIALS_IN_URL",
    );
  }
  return url;
}

function singleHop(
  url: URL,
  budgetMs: number,
  maxBytes: number,
): Promise<{
  status: number;
  location?: string;
  contentType: string;
  buffer: Buffer;
}> {
  let timer: NodeJS.Timeout;
  return new Promise<{
    status: number;
    location?: string;
    contentType: string;
    buffer: Buffer;
  }>((resolve, reject) => {
    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(), budgetMs);

    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          "User-Agent": "AdobosBot/1.0 (+safe-image-fetch)",
          Accept: "image/*",
        },
        lookup: validatingLookup,
        signal: controller.signal,
        // Sin `family`/`hints` custom: `lookup` ya decide y filtra la IP real.
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400 && location) {
          res.resume(); // descarta el cuerpo del redirect, no nos interesa
          resolve({
            status,
            location,
            contentType: "",
            buffer: Buffer.alloc(0),
          });
          return;
        }
        if (status !== 200) {
          res.resume();
          reject(
            new SafeImageFetchError(
              `Unexpected HTTP status ${status}.`,
              "BAD_STATUS",
              502,
            ),
          );
          return;
        }
        const contentType = String(res.headers["content-type"] ?? "");
        const chunks: Buffer[] = [];
        let total = 0;
        res.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > maxBytes) {
            res.destroy();
            reject(
              new SafeImageFetchError(
                `Image exceeds the ${maxBytes} byte limit.`,
                "TOO_LARGE",
                413,
              ),
            );
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          resolve({ status, contentType, buffer: Buffer.concat(chunks) });
        });
        res.on("error", (err) => reject(err));
      },
    );
    req.on("error", (err) => {
      if (err instanceof SafeImageFetchError) {
        reject(err);
        return;
      }
      if (controller.signal.aborted) {
        reject(new SafeImageFetchError("Timed out.", "TIMEOUT", 504));
        return;
      }
      reject(err);
    });
    req.end();
  }).finally(() => clearTimeout(timer));
}

/** Descarga y valida una imagen remota. Lanza `SafeImageFetchError` si algo falla. */
export async function safeImageFetch(
  rawUrl: string,
  options: SafeImageFetchOptions = {},
): Promise<SafeImageResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;

  const deadline = Date.now() + timeoutMs;
  let current = assertSafeUrl(rawUrl);

  for (let hop = 0; ; hop++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new SafeImageFetchError("Timed out.", "TIMEOUT", 504);
    }
    let hopResult: Awaited<ReturnType<typeof singleHop>>;
    try {
      hopResult = await singleHop(current, remaining, maxBytes);
    } catch (error: unknown) {
      logger.warn(
        {
          host: current.hostname,
          err: error instanceof Error ? error.message : error,
        },
        "safeImageFetch: hop failed",
      );
      throw error instanceof SafeImageFetchError
        ? error
        : new SafeImageFetchError(
            "Image download failed.",
            "FETCH_FAILED",
            502,
          );
    }

    if (hopResult.location) {
      if (hop >= maxRedirects) {
        throw new SafeImageFetchError(
          "Too many redirects.",
          "TOO_MANY_REDIRECTS",
        );
      }
      const next = new URL(hopResult.location, current);
      current = assertSafeUrl(next.toString());
      continue;
    }

    const magic = sniffImageMagic(hopResult.buffer);
    if (!magic || !hopResult.contentType.toLowerCase().startsWith("image/")) {
      throw new SafeImageFetchError(
        "The response is not a valid image (Content-Type/magic bytes mismatch).",
        "NOT_AN_IMAGE",
      );
    }

    return { buffer: hopResult.buffer, contentType: magic };
  }
}
