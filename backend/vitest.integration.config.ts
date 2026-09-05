import { defineConfig } from "vitest/config";

// Mismo resolver de `#core/*`/`#db/*` que vitest.config.ts — ver ese archivo.
const conditions = ["adobos-src", "import", "module", "node", "default"];

/**
 * Tests que hablan con Postgres real (Fase 0/§4 del plan: "no mockear Drizzle
 * para validar transacciones, constraints o carreras"). Requiere
 * `DATABASE_URL` apuntando a una base descartable — por defecto la misma que
 * usa `docker compose up` en desarrollo (localhost:5432, ya migrada).
 * `initDatabase()` aplica migraciones pendientes al conectar.
 */
export default defineConfig({
  resolve: { conditions },
  ssr: { resolve: { conditions } },
  test: {
    include: ["test/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 15_000,
    hookTimeout: 15_000,
    // Serializado: varios archivos compartiendo la misma conexión/tablas.
    fileParallelism: false,
  },
});
