# Runbook de recuperación

Fase 8 (`PLAN_FINAL_2026.md`, §14): "runbook de recuperación de Postgres,
Redis, gateway y webhook backlog", más la guía de Redis fuera de la red
local de Compose (mismo §14: "usar `rediss://`, autenticación y ACL cuando
Redis deje la red local de Compose").

Contexto que vale para todo este documento: los tres roles de la
aplicación (`api`/`gateway`/`worker`) son la misma imagen
(`adobos-backend:latest`), sin estado propio en disco — el estado real vive
en Postgres, Redis y los volúmenes de uploads (`/data`). Reiniciar un
contenedor de aplicación nunca pierde datos; los procedimientos de abajo son
para cuando el problema está en la infraestructura de la que esos
contenedores dependen.

## Postgres

### Reinicio simple (contenedor caído, host reiniciado)

El volumen (`adobos_pgdata` / `adobos_loadtest_adobos_pgdata` / el que
corresponda al proyecto Compose) sobrevive un `docker compose restart
postgres` o un reinicio de host — no hace falta ninguna acción manual.
`connectDatabase()` (`backend/src/db/client.ts`, `withPgRetry`) reintenta con
backoff exponencial (8 intentos, hasta 5s entre reintentos) mientras Postgres
todavía no acepta conexiones, así que los tres roles se recuperan solos
cuando Postgres vuelve a estar arriba — no hace falta reiniciarlos a mano.

Verificar recuperación: `curl http://localhost:3000/api/health/ready` — el
campo `postgres` debe volver a `true`.

### Volumen perdido / corrupto (recuperación desde backup)

**Este proyecto no automatiza backups de Postgres todavía** — es una
brecha real, no una omisión de este documento. Hasta que exista un cron de
`pg_dump` (o un servicio gestionado con snapshots), la única copia vive en
el volumen Docker (`adobos_pgdata` en dev, el nombre equivalente en prod) —
un `docker volume rm` o la pérdida del disco del host se lleva todo. Antes
de cualquier operación destructiva sobre ese volumen, backup manual:

```bash
# Backup (dump lógico, portable entre versiones de Postgres):
docker compose exec -T postgres pg_dump -U adobos -d adobos -Fc > adobos_$(date +%Y%m%d_%H%M%S).dump

# Restore contra una DB nueva/vacía:
docker compose exec -T postgres pg_restore -U adobos -d adobos --clean --if-exists < adobos_20260101_000000.dump
```

`--clean --if-exists` permite restaurar sobre una DB que ya tiene el schema
de las migraciones Drizzle sin chocar con `CREATE TABLE` duplicados. Tras un
`pg_restore`, correr `pnpm --filter @adobos/backend db:generate` en modo
verificación (sin cambios pendientes esperados) para confirmar que el schema
restaurado coincide con las migraciones actuales — si difieren, hay
migraciones que corrieron después del backup y falta aplicarlas
(`docker compose run --rm migrate`).

### Agotamiento de conexiones (`FATAL: sorry, too many clients already`)

Ver `docs/CAPACITY.md` para el presupuesto completo. Diagnóstico rápido:

```sql
SELECT application_name, count(*) FROM pg_stat_activity GROUP BY application_name ORDER BY 2 DESC;
```

Si `adobos-api` excede `N_réplicas × 8` de forma sostenida, hay una fuga de
conexiones (buscar código que abra un `postgres()` propio en vez de usar
`getDb()`/`connectDatabase()`) — no un problema de tráfico normal, el pool
tiene un techo duro (`max` en `connectDatabase()`) que nunca debería
excederse por diseño.

## Redis

### Reinicio simple

Con AOF activo (`--appendonly yes --appendfsync everysec`, ver commit de
Fase 8 que lo activó), un reinicio limpio o un crash pierde como mucho 1
segundo de escrituras — Redis reconstruye su estado desde el archivo AOF al
arrancar. Verificar que cargó bien:

```bash
docker compose exec redis redis-cli INFO persistence | grep -E "aof_enabled|loading"
```

`aof_enabled:1` y `loading:0` = recuperación completa. Si `loading:1` se
queda pegado, el archivo AOF puede estar corrupto (crash a mitad de una
escritura) — `redis-check-aof --fix /data/appendonlydir/appendonly.aof.1.incr.aof`
(dentro del contenedor, con Redis **parado**) repara los últimos comandos
incompletos, a costa de perderlos.

### Redis completamente perdido (volumen borrado)

Consecuencias por dato, no todas iguales:

- **Caché L2** (`core/cache/redisStore.ts`): se repuebla sola, read-through,
  sin acción manual — solo hay un pico de latencia/carga en Postgres
  mientras se recalienta.
- **Rate limiting** (`core/http/rateLimit.ts`): arranca en cero — sin
  impacto de datos, como mucho una ventana corta sin límites activos.
- **Jobs de BullMQ en vuelo** (recordatorios, giveaways, scheduled-messages,
  reintentos de compra/webhook pendientes): **se pierden** — no hay AOF que
  los recupere porque el volumen entero desapareció. `core/queue/index.ts`
  ya documenta el modo degradado: sin `REDIS_URL` alcanzable, `.add()` cae a
  ejecución inline (un solo proceso, sin colas) en vez de fallar duro. Tras
  reponer Redis, los jobs perdidos no se reintentan solos — para
  scheduled-messages/reminders/giveaways, el próximo tick de su cron
  recalcula qué falta enviar desde el estado en Postgres (son crons
  idempotentes por diseño, no colas de eventos de una sola vez); para
  compras/webhooks, ver la sección de abajo.

## Gateway (Client de Discord)

### Desconexión de un shard / reconexión

Ya instrumentado (Fase 8, métricas): `discord_shard_reconnects_total`,
`discord_shard_disconnects_total`, `discord_shard_resumes_total` en
`/metrics` del rol `gateway`. discord.js reconecta y resume sesión solo —
no requiere intervención mientras los contadores de `disconnect`/`reconnect`
no crezcan sin que le sigan `resume`/`ready` (eso sí sería señal de un
problema de red sostenido entre el contenedor `gateway` y Discord, no un
blip pasual).

### Contenedor `gateway` caído

`restart: unless-stopped` lo revive solo. Al reconectar, `installCacheWarmer`
vuelve a instalar sus listeners y la caché de Redis se resincroniza por
evento — no hace falta un "full resync" manual. Verificar con
`/api/health` (`botReady: true`) del propio contenedor `gateway`.

### Token de Discord rotado/revocado

El proceso no reintenta login con un token inválido indefinidamente — cae
en el log de arranque (`bot.login()` rechaza la promesa, `main().catch(...)`
llama `runShutdown("startup-failure", 1)`, el contenedor termina con código
1). `restart: unless-stopped` lo reinicia en loop hasta que se corrija
`DISCORD_TOKEN` en `.env` y se recreen los contenedores
(`docker compose up -d --force-recreate gateway worker backend` — los tres
roles leen el mismo `.env`).

## Webhook backlog (Stripe)

Con la alerta de Fase 8 (`ops_webhook_inbox_backlog` / `logger.error` cada 5
min si hay eventos sin procesar hace más de 10 minutos):

1. **Diagnóstico** — ver qué hay atascado y por qué:

   ```sql
   SELECT event_id, event_type, status, attempts, last_error, received_at
   FROM webhook_events
   WHERE status != 'processed'
   ORDER BY received_at ASC;
   ```

2. **Si `status = 'pending'` y `attempts` bajo**: es normal en tránsito
   (`reconcileStaleWebhookEvents`, `backend/src/modules/billing/inbox.ts`,
   corre cada 2 minutos, gateado por `isWorkerLeader()` — confirmar que
   ALGÚN worker es líder: `SELECT * FROM worker_leases WHERE name =
   'worker'`, `expires_at` debe estar en el futuro). Si no hay líder, ver la
   sección de Postgres/`worker` de este runbook — sin líder, ni esta
   reconciliación ni ningún otro cron corre.

3. **Si `status = 'failed'` con `attempts >= 5`** (dead letter — la
   reconciliación ya no lo reintenta solo): dos caminos, no mutuamente
   excluyentes:
   - **Preferido**: reenviar el evento desde el Dashboard de Stripe
     (Developers → Webhooks → el endpoint → el evento → "Resend"). Stripe
     lo entrega como un delivery nuevo; el `eventId` es el mismo, así que si
     el problema ya se corrigió (el bug que lo hacía fallar, o la
     conectividad a Stripe), el claim atómico (`INSERT ... ON CONFLICT DO
     NOTHING` en `inbox.ts`) lo procesa limpio en el próximo intento porque
     la fila sigue en `failed`, no en `processed`.
   - **Manual** (si Stripe ya no puede reenviarlo, o hace falta forzar el
     reintento sin esperar a Stripe): resetear la fila para que la
     reconciliación lo tome de nuevo —
     ```sql
     UPDATE webhook_events SET status = 'pending', attempts = 0, last_error = NULL
     WHERE event_id = '<id>';
     ```
     Correr esto solo después de confirmar en los logs (`lastError`) qué
     rompió el procesamiento original — resetear sin arreglar la causa
     repite el mismo fallo 5 veces más y vuelve a dead-letter.

4. **No hay forma de "purgar" un webhook fallido sin más** — `webhookEvents`
   no tiene borrado automático; son pocas filas por diseño (solo eventos de
   Stripe, no todo el tráfico HTTP), así que no hace falta.

## Redis fuera de la red local de Compose (`rediss://`, autenticación, ACL)

Hoy Redis vive exclusivamente dentro de la red Docker `adobos` — ningún
Compose publica su puerto en prod (`docker-compose.prod.yml`; el dev sí
publica `6379:6379`, pero es un entorno local de un solo desarrollador,
no una red compartida) y `REDIS_URL` apunta al hostname interno `redis`,
sin TLS ni contraseña. Mientras esa topología no cambie, esto es
aceptable — la superficie de ataque es la misma red privada donde ya vive
Postgres sin TLS tampoco.

**Si Redis se muda fuera de esa red** (un Redis gestionado, un host
separado, cualquier topología donde el tráfico Redis cruce una red que no
controla por completo el propio Compose), estos tres cambios pasan a ser
obligatorios, no opcionales:

1. **`rediss://`**: ya soportado sin cambios de código —
   `backend/src/core/env.ts` valida `REDIS_URL` contra
   `redis://…` o `rediss://…`, e `ioredis` (`core/cache/redis.ts`,
   `core/queue/connection.ts`) activa TLS automáticamente al ver el
   esquema `rediss://`. Solo hace falta cambiar el valor de `REDIS_URL` en
   `.env`.
2. **Autenticación**: `rediss://:<password>@host:puerto` — `ioredis` extrae
   la contraseña de la URL sola, sin config adicional. Del lado del
   servidor, un Redis gestionado la pide por defecto; uno propio necesita
   `requirepass` en `redis.conf` o `--requirepass` en el `command:` del
   servicio (mismo lugar donde hoy está `--appendonly yes`).
3. **ACL**: si el Redis gestionado/compartido lo soporta, crear un usuario
   de aplicación con permisos acotados a los comandos que
   `ioredis`/BullMQ realmente usan (no `default` con acceso total) —
   `rediss://<user>:<password>@host:puerto` en `REDIS_URL` (ioredis soporta
   usuario en la URL desde ACL de Redis 6+).

Nada de esto necesita releer código más allá de `.env` — es exactamente el
mismo mecanismo ya validado en `env.ts`, solo que hoy nadie lo ejercita
porque Redis no ha cruzado esa frontera todavía.

## Ver también

- `docs/CAPACITY.md` — presupuesto de conexiones Postgres y prueba de
  carga (Fase 8).
- `docs/DEPRECATIONS.md` — calendario de retiro de `@deprecated` (Fase 7).
