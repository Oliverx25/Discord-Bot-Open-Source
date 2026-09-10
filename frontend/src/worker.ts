/**
 * Worker: proxy BFF a Express + SSR de Astro (`@astrojs/cloudflare`).
 *
 * Env se declara a mano para que `astro check` no mezcle workerd con DOM.
 */

import { handle } from "@astrojs/cloudflare/handler";

interface WorkerEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  ORIGIN_URL: string;
}

type WorkerContext = {
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
};

const PROXY_PREFIXES = ["/api", "/auth", "/uploads"] as const;

function shouldProxy(pathname: string): boolean {
  return PROXY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function proxyOrigin(env: WorkerEnv): string {
  // Docker/dev: Vite inyecta INTERNAL_API_URL (`http://backend:3000`).
  const fromAstro = import.meta.env.INTERNAL_API_URL?.trim();
  if (fromAstro) return fromAstro.replace(/\/$/, "");
  return (env.ORIGIN_URL ?? "").replace(/\/$/, "");
}

function proxyToOrigin(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = proxyOrigin(env);
  if (!origin) {
    return Promise.resolve(
      new Response("ORIGIN_URL is not configured.", { status: 500 }),
    );
  }

  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, `${origin}/`);

  const headers = new Headers(request.headers);
  headers.set("X-Forwarded-Host", incoming.host);
  headers.set("X-Forwarded-Proto", incoming.protocol.replace(":", ""));
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) headers.set("X-Forwarded-For", ip);
  headers.delete("host");

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  return fetch(target, init);
}

export default {
  fetch(
    request: Request,
    env: WorkerEnv,
    ctx: WorkerContext,
  ): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (shouldProxy(pathname)) {
      return proxyToOrigin(request, env);
    }
    return handle(
      request,
      env as Parameters<typeof handle>[1],
      ctx as Parameters<typeof handle>[2],
    );
  },
};
