import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { readGuildIdFromCookieHeader } from "./src/lib/guildCookie";
import {
  PANEL_CONTEXT_HEADER,
  SESSION_USER_HEADER,
} from "./src/server/session-header";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const backendUrl = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3000";
const apiOrigin = backendUrl.replace(/\/$/, "");

function isDashboardPath(pathname) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

/** Node resuelve `backend` en Docker; workerd no. Inyecta sesión al SSR. */
function sessionProbePlugin() {
  return {
    name: "tobot-session-probe",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathName = (req.url ?? "/").split("?")[0];
        delete req.headers[SESSION_USER_HEADER];
        delete req.headers[PANEL_CONTEXT_HEADER];
        const cookie = req.headers.cookie;
        if (!cookie) {
          next();
          return;
        }

        const isLanding = pathName === "/" || pathName === "";
        const isDashboard = isDashboardPath(pathName);
        if (!isLanding && !isDashboard) {
          next();
          return;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const headers = { Accept: "application/json", Cookie: cookie };

        const probe = isLanding
          ? fetch(`${apiOrigin}/api/me/user`, {
              headers,
              signal: controller.signal,
            }).then(async (response) => {
              if (!response.ok) return;
              const body = await response.json();
              const user = body?.user;
              if (user?.id) {
                req.headers[SESSION_USER_HEADER] = encodeURIComponent(
                  JSON.stringify(user),
                );
              }
            })
          : fetch(`${apiOrigin}/api/me`, {
              headers,
              signal: controller.signal,
            }).then(async (response) => {
              if (!response.ok) return;
              const me = await response.json();
              if (!me?.user?.id) return;
              const guilds = Array.isArray(me.guilds) ? me.guilds : [];
              const wanted = readGuildIdFromCookieHeader(cookie);
              const selected =
                guilds.find((guild) => guild.id === wanted) ?? guilds[0];
              let tier = "free";
              if (selected?.id) {
                const entUrl = new URL("/api/entitlements", `${apiOrigin}/`);
                entUrl.searchParams.set("guildId", selected.id);
                const entRes = await fetch(entUrl, {
                  headers,
                  signal: controller.signal,
                });
                if (entRes.ok) {
                  const snapshot = await entRes.json();
                  if (snapshot?.tier) tier = snapshot.tier;
                }
              }
              req.headers[PANEL_CONTEXT_HEADER] = encodeURIComponent(
                JSON.stringify({ me, tier }),
              );
            });

        probe.catch(() => {}).finally(() => {
          clearTimeout(timer);
          next();
        });
      });
    },
  };
}

/**
 * SSR en Cloudflare. Worker proxea /api /auth /uploads al VPS.
 */
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "https://tobot.gg",
  output: "server",
  adapter: cloudflare({
    imageService: "passthrough",
    prerenderEnvironment: "node",
    configPath: "./wrangler.jsonc",
  }),
  integrations: [react()],
  env: {
    schema: {
      PUBLIC_API_BASE: envField.string({
        context: "client",
        access: "public",
        default: "",
      }),
      INTERNAL_API_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
  server: {
    host: true,
    port: 4321,
  },
  devToolbar: {
    enabled: false,
  },
  vite: {
    plugins: [sessionProbePlugin(), tailwindcss()],
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/react-query-persist-client",
        "@tanstack/query-sync-storage-persister",
        "@nanostores/react",
      ],
    },
    resolve: {
      alias: {
        "@": path.join(rootDir, "src"),
      },
      // pnpm puede resolver `react` desde copias distintas; el hidratador de
      // islas y los TSX del panel tienen que compartir la misma.
      dedupe: ["react", "react-dom"],
    },
    server: {
      host: true,
      watch: {
        usePolling: true,
        interval: 300,
      },
      hmr: {
        clientPort: 4321,
        host: "localhost",
        protocol: "ws",
      },
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          cookieDomainRewrite: "",
        },
        "/auth": {
          target: backendUrl,
          changeOrigin: true,
          cookieDomainRewrite: "",
        },
        "/uploads": {
          target: backendUrl,
          changeOrigin: true,
          cookieDomainRewrite: "",
        },
      },
    },
  },
});
