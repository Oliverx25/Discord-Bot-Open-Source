/**
 * BFF en el edge: replica docker/nginx.conf.
 * HTML desde Static Assets; /api /auth /uploads se streamean al VPS.
 *
 * Env lo genera `wrangler types` (worker-configuration.d.ts). Aquí se declara
 * a mano para que `astro check` no mezcle los runtime types de workerd con DOM.
 */

interface WorkerEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  ORIGIN_URL: string;
}

const PROXY_PREFIXES = ["/api", "/auth", "/uploads"] as const;

function shouldProxy(pathname: string): boolean {
  return PROXY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function proxyToOrigin(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = env.ORIGIN_URL.replace(/\/$/, "");
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
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (shouldProxy(pathname)) {
      return proxyToOrigin(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
