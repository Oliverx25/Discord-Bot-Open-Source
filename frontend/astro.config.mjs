import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { SESSION_USER_HEADER } from "./src/server/session-header";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const backendUrl = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3000";
const apiOrigin = backendUrl.replace(/\/$/, "");

/** Node resuelve `backend` en Docker; workerd no. Inyecta el user al SSR. */
function sessionProbePlugin() {
  return {
    name: "tobot-session-probe",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathName = (req.url ?? "/").split("?")[0];
        if (pathName !== "/") {
          next();
          return;
        }
        delete req.headers[SESSION_USER_HEADER];
        const cookie = req.headers.cookie;
        if (!cookie) {
          next();
          return;
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        fetch(`${apiOrigin}/api/me/user`, {
          headers: { Accept: "application/json", Cookie: cookie },
          signal: controller.signal,
        })
          .then(async (response) => {
            if (!response.ok) return;
            const body = await response.json();
            const user = body?.user;
            if (user?.id) {
              req.headers[SESSION_USER_HEADER] = encodeURIComponent(
                JSON.stringify(user),
              );
            }
          })
          .catch(() => {})
          .finally(() => {
            clearTimeout(timer);
            next();
          });
      });
    },
  };
}

/**
 * SSR en Cloudflare. El dashboard legacy se prerenderiza.
 * Worker proxea /api /auth /uploads al VPS.
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
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
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
