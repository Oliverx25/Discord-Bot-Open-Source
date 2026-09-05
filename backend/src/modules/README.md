# Módulos Lego (backend)

Cada módulo es un bloque plug-and-play: declara solo las fases que necesita
y el kernel corre únicamente las del rol activo (`api | gateway | worker`
— ver `PLAN_FINAL_2026.md` y `core/runtime/index.ts`).

## Layout de un módulo

```text
modules/<id>/
├── module.ts              # exporta un AdobosModule (registerHttp/registerGateway/registerJobs)
├── module.test.ts
├── domain/                 # lógica de negocio + acceso a DB (funciones puras donde se pueda)
├── http/
│   ├── routes.ts
│   └── schema.ts           # validación zod del borde HTTP
├── discord.ts               # llamadas a Discord vía BotGateway (si aplica)
└── jobs.ts                  # productor/consumidor de cola (si el módulo tiene crons)
```

No todos los módulos usan las cinco piezas — un módulo de solo lectura no
necesita `jobs.ts`, uno sin Discord no necesita `discord.ts`. La única regla
dura es `module.ts` como punto de entrada único.

## Añadir un módulo

1. Crear `backend/src/modules/<id>/module.ts` exportando un `AdobosModule`
   (`id`, `name`, y las fases `registerHttp?` / `registerGateway?` /
   `registerJobs?` que necesite — ver `core/modules/types.ts`).
2. Añadirlo a `ENABLED_MODULES` en `backend/src/modules/index.ts`.
3. Crear `frontend/src/features/<id>/` + thin page en `pages/dashboard/`.
4. (Opcional) entrada en `frontend/src/lib/nav.ts`.

## Reglas

- No editar `core/http/createApp.ts` ni `core/discord/interactionRouter.ts`
  para features nuevas — el kernel enruta a los módulos vía `ModuleContext`
  (`ctx.route`, `ctx.button`, `ctx.command`, etc.), no al revés.
- `registerHttp(ctx)` corre solo en `api`; `registerGateway(ctx)` solo en
  `gateway`; `registerJobs(ctx)` solo en `worker`. Un cron que gatea con
  `isWorkerLeader()` debe re-chequearlo en cada tick del `setInterval`, no
  solo una vez al registrar — el lease de liderazgo puede cambiar de dueño
  después del boot (`core/runtime/workerLease.ts`).
- `domain/` no importa nada de `http/`; `http/` valida con zod y llama a
  `domain/`. `discord.ts` es la única pieza que debería llamar a `BotGateway`.
