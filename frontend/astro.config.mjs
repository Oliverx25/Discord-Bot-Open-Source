import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, envField } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const backendUrl = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3000";

/**
 * HTML estático (`dist/`). En Cloudflare el Worker hace de BFF same-origin
 * (proxy /api /auth /uploads). En dev, Vite replica ese proxy.
 */
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "https://tobot.gg",
  output: "static",
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
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@tanstack/react-query",
        "@nanostores/react",
      ],
    },
    resolve: {
      alias: {
        "@": path.join(rootDir, "src"),
      },
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
