# Calendario de retiro de `@deprecated`

Fase 7 (MAINT-01), último ítem del checklist de `PLAN_FINAL_2026.md` §13.
Inventario completo de todo lo marcado `@deprecated` en `backend/`,
`packages/shared/` y `frontend/` a 2026-09-04, con su reemplazo, uso real
verificado (`rg`, y para tablas/columnas, conteo de filas en la DB de dev) y
una fecha objetivo de retiro.

Cómo usar esta tabla: antes de borrar cualquier ítem, repetir la verificación
de uso (`rg -w "<símbolo>" backend/src packages/shared/src frontend/src`) y,
si aplica, el conteo de filas — **contra producción**, no solo contra dev —
porque los números de este documento son de la DB de dev local (todos en 0,
lo cual no prueba nada sobre producción).

## Tier 1 — Cero consumidores, retirar ya (sin trabajo de migración)

Verificado: cada símbolo no tiene más referencias que su propia declaración
(y, cuando aplica, una línea de re-export en un barrel/manifest). Se pueden
borrar en un solo commit mecánico (borrar función/tipo + la línea de
re-export si existe) sin tocar ningún llamador real.

**Objetivo: antes de cerrar Fase 8** (ninguna depende de trabajo de datos,
así que no hay razón para esperar más que la disciplina de "un commit
chico por PR" de Fase 7).

| Símbolo | Archivo | Reemplazo | Nota |
|---|---|---|---|
| `levelFromXp` | `packages/shared/src/levels.ts:233` | `calculateLevel` | — |
| `xpForLevel` | `packages/shared/src/levels.ts:238` | `calculateBaseXPForLevel` | — |
| `BotProfileResponse` | `packages/shared/src/bot-profile.ts:84` | `BotGuildProfileResponse` | — |
| `UpdateBotProfileResponse` | `packages/shared/src/bot-profile.ts:86` | `UpdateBotGuildProfileResponse` | — |
| `FormsConfig` | `packages/shared/src/forms.ts:123` | `InteractiveForm` | — |
| `UpdateFormsConfigRequest` | `packages/shared/src/forms.ts:126` | `UpdateFormRequest` | — |
| `FormsConfigResponse` | `packages/shared/src/forms.ts:129` | `FormResponseBody` | — |
| `PublishFormsResponse` | `packages/shared/src/forms.ts:132` | `PublishFormResponse` | — |
| `defaultFormsConfig` | `packages/shared/src/forms.ts:196` | `defaultInteractiveForm` | — |
| `InteractiveRoleMappingInput` | `packages/shared/src/autoroles.ts:33` | `AutoroleMappingItem` | — |
| `SystemCommandParameter` | `packages/shared/src/system-commands/contracts.ts:62` | `SystemCommandOption` | — |
| `getBotProfile` (función) | `backend/src/modules/bot-profile/discord.ts:208` | `getGuildBotProfile` | Ojo: **no** confundir con el método homónimo de `BotGateway` (`gateway.getBotProfile(...)`), que no está deprecado y sí se usa en todo el codebase. Borrar también el re-export en `bot-profile/module.ts:25`. |
| `updateBotProfile` (función) | `backend/src/modules/bot-profile/discord.ts:374` | `updateGuildBotProfile` | Borrar también el re-export en `bot-profile/module.ts:29`. |
| `claimDailyReward` | `backend/src/modules/economy/domain/funds.ts:933` | `claimFixedIncome(..., "daily", ...)` | — |
| `wireCustomCommandsBuiltinSync` | `backend/src/modules/custom-commands/module.ts:38` | (ninguno — no-op histórico) | Llamada una vez en `backend/src/index.ts:72`; borrar la función y esa llamada juntas. |
| `syncDefaultCommands` | `backend/src/modules/system-commands/sync.ts:127` | `syncGlobalCommands` | Borrar también el re-export en `system-commands/module.ts:73`. |
| `publishFormsMessage` | `backend/src/modules/forms/publish.ts:203` | `publishFormMessage(formId)` | Ya solo lanza `FormsError("DEPRECATED")`; borrarla no rompe nada. |
| `createAutoRole` | `frontend/src/lib/api/autoroles.ts:75` | `createAutoroleCompact` | Borrar también el re-export en `frontend/src/lib/api.ts:22`. |
| `fetchBotProfile` | `frontend/src/lib/api/bot-profile.ts:21` | `fetchBotGuildProfile` | Borrar también el re-export en `frontend/src/lib/api.ts:40`. |
| `saveBotProfile` / `SaveBotProfileInput` | `frontend/src/lib/api/bot-profile.ts:67-68` | `saveBotGuildProfile` / `SaveBotGuildProfileInput` | Borrar también los re-exports en `frontend/src/lib/api.ts:42`. |
| `fetchFormsConfig` | `frontend/src/lib/api/forms.ts:156` | `fetchForms` + `createForm` | Borrar también el re-export en `frontend/src/lib/api.ts:82`. |
| `saveFormsConfig` | `frontend/src/lib/api/forms.ts:166` | `saveForm` / `createForm` | Borrar también el re-export en `frontend/src/lib/api.ts:83`. |
| `publishFormsConfig` | `frontend/src/lib/api/forms.ts:175` | `publishFormMessage` | Borrar también el re-export en `frontend/src/lib/api.ts:84`. |
| `labelForChangeKey` | `frontend/src/features/moderation/auditChangeFormat.ts:260` | `humanizePropertyKey` | — |
| `formatChangeValue` | `frontend/src/features/moderation/auditChangeFormat.ts:265` | `humanizePropertyValue` | — |
| `NavCategoryConfig.defaultCollapsed` | `frontend/src/lib/nav.ts:61` | (ninguno) | Ya "Ignored at runtime" según su propio comentario; borrar el campo y sus usos en datos de nav si quedan. |

## Tier 2 — Activos como fallback de lectura de datos legacy

Estos SÍ tienen lectores en producción hoy (compatibilidad hacia atrás para
filas viejas). No se pueden borrar hasta hacer un backfill de una sola vez y
confirmar que ninguna fila viva depende ya del campo legacy.

**Objetivo: evaluar el backfill en Fase 8** (encaja con el trabajo de
observabilidad/capacidad — es un buen momento para correr un script de
mantenimiento de datos), **retirar en Fase 9 o la siguiente ventana de
mantenimiento** una vez el backfill esté confirmado en producción.

| Símbolo / columna | Archivo | Lector actual | Precondición para retirar |
|---|---|---|---|
| `economyShopItems.actionSequence` | `backend/src/db/schema/economy.ts:166` | `shopService.ts:218` (`rewardsFromActionSequence`, fallback si `rewards` está vacío) | Backfill: recalcular `rewards` desde `actionSequence` para toda fila existente, luego confirmar `count(*) WHERE jsonb_array_length(action_sequence) > 0` = 0 en producción (dev hoy: 0). |
| `economyShopItems.rewardType` / `rewardConfig` | `backend/src/db/schema/economy.ts:168,170` | `shopService.ts:223` (`legacySingleToRewards`, fallback si `rewards` y `actionSequence` están vacíos) | Mismo backfill que arriba (recalcular `rewards`), luego confirmar `count(*) WHERE reward_type IS NOT NULL` = 0 en producción (dev hoy: 0). |
| `welcomeSettings.primaryText` / `secondaryText` / `textX` / `textY` | `backend/src/db/schema/welcome.ts:28,32,43` | `welcome/domain/welcome.ts` (deriva `textLayers` por defecto si la fila no tiene capas) y `gateway/guildMemberAdd.ts` | Backfill: sintetizar `textLayers` para toda fila con `text_layers IS NULL` a partir de estas 4 columnas, luego confirmar `count(*) WHERE text_layers IS NULL` = 0 en producción (dev hoy: 0). Coordinar con `WelcomeCardBuilder.ts` (mismas 6 opciones deprecadas: `primaryText`, `secondaryText`, `textX`, `textY`, `fontSize`, `textColor` — se retiran juntas). |
| `ActionLogChannelsMapping.server` | `packages/shared/src/action-logs.ts:116` | Ningún lector activo encontrado (`rg ".server" backend/src/modules/action-logs` → vacío) | Es una sub-clave de un documento `jsonb`, no una columna — se puede quitar del tipo ya (Tier 1 en la práctica); filas viejas con esa clave quedan como ruido inofensivo en el JSON hasta que se re-guarden. Se deja en Tier 2 solo por prudencia documental, pero no bloquea nada. |
| `EconomyCasinoCoinflipConfig.allowDoubleOrNothing` | `packages/shared/src/economy-casino.ts:8` | Ninguno en runtime (el comentario ya lo dice: "No hay segundo tiro en runtime; se conserva en JSON") | Quitar del tipo cuando se toque `economyCasino.coinflip` de nuevo por otra razón; no justifica una migración propia. |
| `EconomyCasinoRouletteConfig.bettingTimeSeconds` | `packages/shared/src/economy-casino.ts:18` | Ninguno en runtime (mismo caso) | Igual que arriba. |

## Tier 3 — Tablas legacy completas

Retiro más caro: requiere confirmar cero filas vivas y luego una migración
`DROP TABLE`. No se puede apurar — hay que verificar producción, no solo dev.

**Objetivo: Fase 9+ / próxima ventana de mantenimiento de DB**, después de
confirmar en producción (no alcanza con el conteo de dev de abajo, que da 0
porque dev tiene poca data).

| Tabla | Definición | Superseded by | Estado verificado (dev) | Antes de dropear |
|---|---|---|---|---|
| `interactive_forms` | `backend/src/db/schema/forms.ts:100` | `guild_forms` (multi-formulario) | 0 filas, 0 lectores/escritores en código (confirmado en sesión previa y de nuevo acá) | Ya no tiene ningún consumidor — es la más lista para dropear de las tres. Confirmar `count(*)` en producción y generar la migración `DROP TABLE interactive_forms`. |
| `reaction_roles_menus` | `backend/src/db/schema/autoroles.ts:52` | `autoroles_registry` | 0 filas en dev, **pero sigue con lectores/escritores activos**: `backend/src/modules/autoroles/http/controller.ts:360-378` | No es solo un conteo de filas — primero hay que migrar el controller para dejar de escribir esta tabla (usar solo `autoroles_registry`), recién ahí backfillear filas existentes y dropear. Más trabajo que las otras dos filas de esta tabla. |

## Fuera de calendario (no son candidatos a retiro)

- `packages/shared/src/economy-shop.ts:220` `rewardsFromActionSequence` — la
  función de migración en sí. Se retira junto con la columna
  `actionSequence` que migra (Tier 2), no antes.
