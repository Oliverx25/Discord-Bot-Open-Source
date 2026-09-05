# Capacidad: prueba de carga del API y presupuesto de conexiones Postgres

Fase 8 (`PLAN_FINAL_2026.md`, §14): "prueba de carga del API con N réplicas
y presupuesto total de conexiones PostgreSQL". Resultados de 2026-09-05,
contra un stack Docker aislado (no el de dev), imágenes `adobos-backend:latest`
/ `adobos-frontend:latest` reconstruidas ese mismo día.

## Presupuesto de conexiones Postgres

Cada rol abre su propio pool contra Postgres (`backend/src/db/client.ts`,
`poolMax()`), fijo por rol salvo override por `DB_POOL_MAX`:

| Rol | Pool por réplica |
|---|---|
| `api` | 8 |
| `gateway` | 6 |
| `worker` | 6 |

Postgres (`postgres:16-alpine`, tal cual se despliega hoy — sin tuning de
`max_connections`): **`max_connections = 100`**, `superuser_reserved_connections
= 3`. Presupuesto disponible para conexiones de aplicación: **97**.

Fórmula:

```text
conexiones_totales = 8 × N_api + 6 × N_gateway + 6 × N_worker ≤ 97
```

Con la topología típica (1 `gateway` + 1 `worker`, ambos sin necesidad real de
escalar horizontalmente — `gateway` porque el sharding de Discord ya lo cubre
un solo proceso a la escala actual del bot, `worker` porque BullMQ ya reparte
concurrencia con `WORKER_CONCURRENCY=4` dentro de un mismo proceso):

```text
8 × N_api + 12 ≤ 97  →  N_api ≤ 10.6
```

**Techo recomendado: 8-9 réplicas de `api`** (no 10), para dejar margen a la
conexión transitoria de `migrate` en cada deploy y a cualquier conexión de
mantenimiento/monitoreo (`psql` manual, un futuro exporter de métricas de
Postgres, etc.) sin arriesgar `FATAL: sorry, too many clients already`.

Si el bot crece lo suficiente como para necesitar más de un `gateway` o
`worker`, la fórmula de arriba hay que recalcularla con esos valores de N
también — no es un techo fijo, es lineal en los tres roles.

## Metodología de la prueba de carga

1. Stack aislado, proyecto Compose separado del de dev — cero riesgo sobre el
   entorno en uso (`docker compose -f docker-compose.prod.yml -p
   adobos-loadtest up -d postgres redis`, `run --rm migrate` contra una DB
   vacía nueva, `up -d --scale backend=3 backend`). Reutiliza el `.env` real
   (seguro: el rol `api` nunca llama `bot.login()`, así que `DISCORD_TOKEN`
   nunca se usa para conectar a Discord en esta prueba).
2. Generador de carga: un script Node standalone (`fetch` nativo, sin
   dependencias) corrido en un contenedor aparte dentro de la misma red
   Docker (`--network adobos-loadtest_adobos`), apuntando a
   `http://backend:3000/api/health/ready` — el DNS embebido de Compose
   reparte las conexiones entre las 3 réplicas de `backend`. Se eligió
   `/api/health/ready` (no `/api/health`) a propósito: es el único endpoint
   que ejercita Postgres Y Redis en cada request (`pingDatabase()` +
   `pingRedis()`), así que sí estresa el pool de conexiones — `/api/health`
   no toca la DB y hubiera dado un número irrealmente alto sin decir nada
   del pool.
3. 50 conexiones concurrentes, 20 segundos.
4. Verificación del pool: `pg_stat_activity` consultado a mitad de una
   corrida separada, agrupado por `application_name`.

## Resultados

```json
{
  "target": "http://backend:3000/api/health/ready",
  "concurrency": 50,
  "durationSec": 19.972,
  "totalRequests": 250285,
  "ok": 250285,
  "fail": 0,
  "reqPerSec": 12532,
  "statusCounts": { "200": 250285 },
  "latencyMs": { "p50": 3.46, "p90": 6.8, "p99": 11.67, "max": 48.86 }
}
```

Cero errores en 250,285 requests. p99 de 11.67ms con 3 réplicas y una carga
muy por encima de lo que este bot ve hoy en producción.

Conexiones Postgres verificadas a mitad de carga:

```text
application_name | count | max_connections
adobos-api       |    24 |              100
```

`24 = 3 réplicas × poolMax(8)` exacto — confirma la fórmula de arriba en la
práctica, no solo en el papel: el pool se satura a su `max` configurado bajo
carga sostenida y no lo excede.

## Cómo repetir esta prueba

```bash
# 1. Imágenes de prod al día (incluye cualquier cambio de código desde el último build):
POSTGRES_PASSWORD=ci-placeholder docker compose -f docker-compose.prod.yml build gateway frontend

# 2. Stack aislado (usa el .env real del repo — no hace falta uno nuevo):
docker compose -f docker-compose.prod.yml -p adobos-loadtest up -d postgres redis
docker compose -f docker-compose.prod.yml -p adobos-loadtest run --rm migrate
docker compose -f docker-compose.prod.yml -p adobos-loadtest up -d --scale backend=<N> backend

# 3. Carga (ajustar CONCURRENCY/DURATION_MS/TARGET_URL según el caso):
docker run --rm --network adobos-loadtest_adobos \
  -v "$PWD/scripts/loadtest.js:/loadtest.js:ro" \
  -e CONCURRENCY=50 -e DURATION_MS=20000 \
  -e TARGET_URL=http://backend:3000/api/health/ready \
  node:24-bookworm-slim node /loadtest.js

# 4. Conexiones Postgres durante la carga (correr en paralelo al paso 3):
docker exec adobos-loadtest-postgres-1 psql -U adobos -d adobos -c "
  SELECT application_name, count(*) FROM pg_stat_activity
  WHERE application_name LIKE 'adobos-%' GROUP BY application_name;"

# 5. Nunca olvidar el teardown — es un proyecto Compose separado, no se limpia solo:
docker compose -f docker-compose.prod.yml -p adobos-loadtest down -v
```

## Límites de esta prueba

- No pasa por un load balancer real — el reparto entre réplicas depende del
  DNS embebido de Compose (adecuado para validar el pool de conexiones, no
  para medir el comportamiento exacto de un LB de producción como el que
  hipotéticamente se pondría delante de `nginx`).
- `/api/health/ready` es barato (dos pings, sin lógica de negocio) — no
  reproduce el costo real de una ruta de módulo con queries más pesadas o
  llamadas REST a Discord. Sirve para el objetivo puntual de este ítem
  (presupuesto de conexiones), no como sustituto de un load test de
  endpoints de negocio específicos.
- Un solo host Docker Desktop (macOS) — sin aislar CPU/red del generador de
  carga respecto de los contenedores medidos, los números absolutos de
  req/s no son un SLA, son evidencia de que 3 réplicas + el pool configurado
  no colapsan ni exceden `max_connections` bajo carga sostenida.
