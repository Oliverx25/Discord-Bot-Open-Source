# Auditoría de seguridad, arquitectura y operación — Adobos Bot

Fecha: 7 de septiembre de 2026. Revisión: `29001471e1cf3f2cbc4dfc46fc52132a163055d2`.

**Dictamen:** hay una base modular valiosa y controles de seguridad reales, pero existen fallos de aislamiento entre servidores, escalada de privilegios y entrega de trabajos que corregiría antes de ampliar un despliegue multiusuario. Que compilen los tipos y pasen los tests actuales no demuestra que los límites de confianza estén protegidos.

## Alcance y evidencia

Se revisaron backend, contratos y utilidades de shared, configuración de ejecución, Docker y CI. Se excluyó el código de frontend. Se combinaron grafo de código, trazas de llamadas, lectura directa, documentación oficial actual y pruebas aisladas con servicios simulados.

El índice inicial estaba obsoleto; se regeneró y se volvió a comprobar cobertura. La generación de la comprobación principal fue `2026-09-07T23:09:34Z`. Las 50 rutas de evidencia se verificaron; la cobertura parcial de `db/client.ts:183` se contrastó con lectura completa. El grafo no resuelve de manera fiable todas las herencias de los mixins: las escrituras REST se verificaron leyendo la composición y ejecutando un adaptador con REST simulado. La cobertura del índice es una señal auxiliar, no garantía de exhaustividad.

La revisión es estática y dirigida a superficies de riesgo. No se ejecutaron ataques contra Discord, servicios internos, producción ni datos reales. No se midió el heap bajo carga ni se ejecutó integración contra una base de datos descartable. No se inspeccionaron secretos ni historial completo de Git. No se puede concluir que haya ocurrido una intrusión ni certificar ausencia de otras vulnerabilidades.

## Validación realizada

| Comprobación | Resultado |
|---|---|
| Tests backend | 72 archivos; 333 tests aprobados |
| Tests shared | 24 archivos; 166 tests aprobados |
| Typecheck backend y shared | Aprobados |
| Lint backend y shared | 506 archivos; 0 errores y 11 advertencias; sin autofix |
| Dependencias de producción | Sin advisories asociados a rutas del backend en la respuesta de npm |
| Pruebas aisladas | Confirman fallos de IDs BullMQ, jerarquía, autoroles, validación IP, destino REST y resolución de uploads |

`pnpm audit` en esta versión no permite filtrar por workspace; se consultó el lockfile y se seleccionaron únicamente las rutas del backend para el dictamen. Los hallazgos del frontend están excluidos. No se escaneó la imagen de contenedor ni paquetes del sistema operativo. El runtime local fue Node 26.8.1; Docker declara Node 24. BullMQ instalado: 6.3.4. Repetir las regresiones en el runtime de producción es parte del cierre.

Las pruebas están en `docs/audits/security-2026-09-07/probes.mjs` y sus resultados en `probes.json`. Usan mocks y validadores locales; no necesitan Discord, Redis ni PostgreSQL. No son un pentest completo de los endpoints. Para reproducir: desde backend, ejecutar `node --conditions=adobos-src --import tsx ../docs/audits/security-2026-09-07/probes.mjs`. Estas comprobaciones documentan el comportamiento vulnerable actual; deben invertirse como regresiones al corregirlo.

## Hallazgos prioritarios

### SEC-01 · Alta — escrituras en canales de otro servidor

**Evidencia:** [backend/src/core/discord/baseGateway/messaging.ts:48](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/discord/baseGateway/messaging.ts:48) y [backend/src/modules/messages/http/controller.ts:418](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/messages/http/controller.ts:418).

`sendTextMessage` recibe el guild autorizado, pero `BaseGateway.sendMessage` nombra el argumento `_guildId` y lo ignora. Envía directamente a `/channels/{channelId}/messages`. Ni el envío simple ni el método heredado verifican que el canal pertenezca al guild autorizado. La composición de RestGateway conserva ese método.

**Escenario:** un usuario que administra A y puede usar Messages presenta el ID de un canal de B. Si el bot puede escribir en B, el envío usa esa autoridad aunque el usuario no gestione B. La prueba aislada recorrió `sendTextMessage → RestGateway → REST.post` sin ninguna lectura de pertenencia. No se envió ningún mensaje real.

**Corrección:** resolver y validar el canal dentro de cada operación sensible del puerto; rechazar guild ausente o distinto. Auditar igualmente edit, delete, webhooks y operaciones que reciben solo channelId. Añadir pruebas contractuales comunes para los dos adaptadores con A autorizado y canal de B. No basta proteger únicamente el router.

### SEC-02 · Alta — lectura de uploads entre guilds mediante traversal interno

**Evidencia:** [backend/src/core/http/createApp.ts:216](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/http/createApp.ts:216) y [backend/src/lib/dataPaths.ts:37](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/lib/dataPaths.ts:37).

La ruta autoriza `:guildId`, concatena `:filename` ya decodificado y llama a un resolvedor que solo exige permanecer dentro del directorio global de uploads. No exige permanecer dentro de la carpeta del guild autorizado.

**Escenario:** un filename con separadores codificados se decodifica como `../B/archivo.png`. La autorización sigue viendo A y el archivo resuelto pertenece a B. Se confirmó tanto la decodificación con el parser instalado de Express como la resolución del path. Requiere una sesión con acceso a un guild y conocer una ruta existente del otro. No se probó el recorrido a través del proxy de producción.

**Corrección:** validar kind contra una lista cerrada y filename como un único nombre sin separadores ni segmentos especiales; resolver contra la carpeta exacta del guild y verificar pertenencia en `uploaded_assets`. Preferir assetId y recuperación por `(assetId, guildId)`. Probar separadores codificados y doble codificación. Restringir el directorio global evita escapar al sistema, pero no evita este cruce de tenants.

### SEC-03 · Alta — ManageGuild puede convertirse en Administrator mediante autoroles

**Evidencia:** [backend/src/modules/autoroles/http/routes.ts:39](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/autoroles/http/routes.ts:39), [backend/src/modules/autoroles/http/roles.routes.ts:31](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/autoroles/http/roles.routes.ts:31), [backend/src/modules/autoroles/assignable.ts:114](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/autoroles/assignable.ts:114) y [backend/src/modules/autoroles/module.ts:40](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/autoroles/module.ts:40).

Las mutaciones de autoroles no requieren `roles.write`. El validador comprueba existencia, rol administrado y posición respecto del bot; no recibe al actor ni excluye roles con Administrator. Los botones y reacciones ejecutan posteriormente la asignación.

**Escenario:** alguien con ManageGuild, pero sin ManageRoles, configura un botón o reacción que otorgue un rol administrativo existente por debajo del bot y lo activa. La posibilidad depende de la posición y permisos del bot y de la disponibilidad del módulo. La prueba confirma que ese rol pasa el validador; no se cambió ningún rol real.

**Corrección:** exigir ManageRoles al configurar, comprobar jerarquía del actor, restringir qué permisos puede delegar y bloquear roles privilegiados en mecanismos de autoservicio salvo una política explícita del dueño. Revalidar al ejecutar porque el rol puede cambiar después de publicar el botón.

### SEC-04 · Alta — autorización de roles y moderación incompleta

**Evidencia:** [backend/src/modules/roles-builder/discord.ts:185](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/roles-builder/discord.ts:185), [backend/src/modules/roles-builder/http/routes.ts:31](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/roles-builder/http/routes.ts:31) y [backend/src/core/authz/guildPolicy.ts:147](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/authz/guildPolicy.ts:147).

Roles Builder exige ManageRoles, pero valida la jerarquía del bot, no la del actor. Un actor inferior puede editar, mover o borrar roles por encima de él que estén debajo del bot. La creación también deriva posición y permisos de la autoridad del bot, sin comparar el conjunto de permisos del actor.

En moderación, `assertActorOutranksMember` devuelve éxito inmediato tanto para owner como para Administrator. Administrator no equivale al dueño en restricciones de jerarquía. La prueba local devuelve `ok: true` sin consultar miembros ni roles.

**Corrección:** solo el dueño debe recibir la excepción de jerarquía correspondiente. Validar actor, objetivo, rol y bot; al crear o editar permisos, impedir otorgar capacidades fuera de la autoridad delegable del actor. Conservar la protección del dueño objetivo. Usar comparación de roles consistente con Discord, incluyendo empates de posición. [Documentación oficial de permisos](https://docs.discord.com/developers/topics/permissions).

### SEC-05 · Alta, impacto condicionado por red/TLS — bypass del filtro SSRF

**Evidencia:** [backend/src/core/http/safeImageFetch.ts:130](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/http/safeImageFetch.ts:130), [backend/src/core/http/safeImageFetch.ts:198](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/http/safeImageFetch.ts:198).

`assertSafeUrl` solo exige HTTPS y ausencia de credenciales. Las IP privadas se bloquean en el lookup DNS, pero Node puede conectar a una IPv4 literal sin ejecutar ese lookup. Se confirmó que el validador acepta loopback literal. Además, `isBlockedIPv6("::ffff:7f00:1")` devuelve false: el filtro cubre la notación IPv4 decimal embebida, pero no su equivalente hexadecimal.

**Impacto:** se pierde la frontera de egress para URLs configurables de imágenes. No implica por sí solo robo de metadata: HTTPS, validación del certificado, conectividad y el formato de respuesta siguen condicionando qué se puede alcanzar o leer. No se contactó ningún destino interno.

**Corrección:** clasificar literales antes de abrir sockets; normalizar IPv6 con un parser de direcciones; cubrir rangos reservados y mapped IPv4; mantener DNS fijado por conexión y revalidar redirecciones. Añadir bloqueo de egress interno en infraestructura. [Node net](https://nodejs.org/api/net.html).

### SEC-06 · Media — login CSRF por falta de vínculo con el navegador

**Evidencia:** [backend/src/core/auth/oauth.ts:80](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/auth/oauth.ts:80), [backend/src/core/auth/oauth.ts:133](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/auth/oauth.ts:133) y [backend/src/core/auth/sessionStore.ts:69](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/auth/sessionStore.ts:69).

El state es aleatorio, tiene expiración y se consume atómicamente; eso está bien. Sin embargo, la autorización inicial no establece una cookie o vínculo de transacción con el navegador. El callback acepta cualquier par code/state válido de la tabla y crea la cookie de sesión en el navegador que visite la URL.

**Escenario:** un atacante inicia y autoriza su propio login, intercepta su callback antes de consumirlo y hace que la víctima lo visite. El backend puede iniciar en la víctima una sesión de la cuenta del atacante. PKCE vincula el código al verifier, pero aquí no identifica al navegador legítimo. No es un robo directo de la cuenta Discord de la víctima.

**Corrección:** cookie de transacción aleatoria HttpOnly/Secure/SameSite=Lax, vínculo server-side al state y comprobación antes de consumirlo. Manejar múltiples intentos y borrar el vínculo al terminar. [OAuth Security BCP, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html).

### OPS-01 · Alta — recordatorios y mensajes programados no se encolan

**Evidencia:** [backend/src/modules/reminders/jobs.ts:112](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/reminders/jobs.ts:112), [backend/src/modules/scheduled-messages/jobs.ts:301](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/scheduled-messages/jobs.ts:301).

BullMQ 6.3.4 rechaza `reminder:123` y los IDs de mensajes programados con timestamp ISO por contener separadores incompatibles. Se ejecutó el validador de la dependencia instalada y devolvió `Custom Id cannot contain :`.

**Matiz:** `giveaway:123:active` pasa actualmente por una excepción de compatibilidad para exactamente tres segmentos. No lo presento como fallo actual, pero depende de un formato que la documentación desaconseja.

**Corrección:** usar IDs sin dos puntos, por ejemplo prefijo + hash de entidad/ocurrencia. Probar con una Queue real y Redis descartable: los mocks de `queue.add` no detectan esta incompatibilidad. Las filas ya reclamadas necesitan liberación o recuperación después del fallo de enqueue. [BullMQ: Job IDs](https://docs.bullmq.io/guide/jobs/job-ids).

### OPS-02 · Alta — reencolar el mismo ID no recupera jobs terminados o fallidos

**Evidencia:** [backend/src/core/queue/index.ts:42](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/queue/index.ts:42), [backend/src/modules/reminders/jobs.ts:90](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/reminders/jobs.ts:90) y [backend/src/modules/scheduled-messages/jobs.ts:232](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/scheduled-messages/jobs.ts:232).

La cola conserva hasta 1.000 completados y 5.000 fallidos. La deduplicación por jobId también considera esos jobs retenidos. Los productores vuelven a añadir el mismo ID al expirar el claim de DB.

Un reminder que no pudo enviarse por DM ni canal incrementa attempts, pero el handler retorna normalmente: BullMQ lo considera completado. El productor puede reclamarlo de nuevo y `add` no lo ejecutará mientras siga retenido. En scheduled-messages ocurre un bloqueo equivalente tras agotar los reintentos del mismo job. En una cola con poco tráfico esa retención puede durar indefinidamente.

**Corrección:** distinguir fallos transitorios/terminales, hacer fallar el job cuando corresponde y reconciliar estados de DB con estados reales de BullMQ. Usar retry explícito para un fallido o una generación controlada del intento; mantener un identificador de ocurrencia separado. Esta corrección va después de OPS-01. [BullMQ: reintentos](https://docs.bullmq.io/guide/jobs/retrying-job).

### OPS-03 · Alta bajo fallos/carga — promesas huérfanas y falta de límite en render

**Evidencia:** [backend/src/core/workers/welcomeCardPool.ts:47](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/workers/welcomeCardPool.ts:47), [backend/src/core/workers/welcomeCardPool.ts:61](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/workers/welcomeCardPool.ts:61), [backend/src/core/workers/welcomeCardPool.ts:104](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/workers/welcomeCardPool.ts:104).

Un error del worker solo marca `disabled=true`. No rechaza ni limpia sus trabajos pendientes; no hay handler de exit ni deadline por job. Esas promesas pueden quedarse sin resolver y retenidas en `pending`. Un fallo síncrono de postMessage también deja la entrada insertada.

El tamaño del pool limita hilos, no trabajos: pending carece de máximo y el listener del worker inicia operaciones asíncronas sin serializarlas. Una ráfaga puede acumular descargas, buffers y tareas. El fallback inline desplaza trabajo pesado al event loop justo cuando el pool falló.

**Corrección:** asignar trabajos a workers, cerrar cada promesa ante error/exit/timeout, limpiar todos los estados, limitar admisión global y por guild y rechazar/suprimir renders bajo saturación. Añadir límites de dimensiones/píxeles antes de decodificar: limitar bytes comprimidos no limita memoria nativa del canvas. Son defectos de ciclo de vida demostrables por código; no se cuantificó una tasa de fuga con heap snapshots.

### OPS-04 · Media — streams de error/redirección pierden el deadline

**Evidencia:** [backend/src/core/http/safeImageFetch.ts:258](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/http/safeImageFetch.ts:258).

En respuestas 3xx y no-200, singleHop hace `res.resume()` y resuelve/rechaza inmediatamente. El finally borra el timeout, aunque el cuerpo de esa respuesta pueda seguir abierto. Un origen malicioso puede mantener tráfico y sockets después de que la operación lógica haya terminado.

**Corrección:** destruir/cancelar los cuerpos descartados o drenarlos con límite y deadline conservados hasta su cierre. Probar redirección y 404 que envían un cuerpo interminable. No se abrió ese tráfico durante la auditoría.

### OPS-05 · Media — el lease no ofrece fencing efectivo

**Evidencia:** [backend/src/core/runtime/workerLease.ts:33](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/runtime/workerLease.ts:33), [backend/src/core/runtime/workerLease.ts:56](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/runtime/workerLease.ts:56).

Se emite un fencing token, pero no se consume para rechazar escrituras de un líder anterior. La expiración se calcula con el reloj del proceso y se compara con `now()` de PostgreSQL. El estado booleano local no expira por sí mismo durante una pausa larga o renovación bloqueada; además, setInterval permite renovaciones superpuestas.

**Impacto:** bajo pausas, desfase de relojes o failover puede haber dos productores lógicos o trabajo viejo que continúa después de perder liderazgo. Los claims atómicos de algunas tablas reducen el riesgo; no corresponde afirmar que todos los jobs se duplican.

**Corrección:** calcular y comparar expiración en DB, serializar renovaciones y validar vigencia; usar el token en operaciones protegidas cuando el destino permita fencing. Para Discord, cuya API no acepta ese token, usar registros de ocurrencia y reconciliación explícita. Un lease no vuelve exactly-once a un efecto externo.

### OPS-06 · Media — reconciliación Stripe puede reclamar pending varias veces

**Evidencia:** [backend/src/modules/billing/inbox.ts:158](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/billing/inbox.ts:158) y [backend/src/modules/billing/inbox.ts:208](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/billing/inbox.ts:208).

Para un evento stale en pending, el UPDATE verifica `status='pending'` y lo deja en pending. Dos reconciliadores que leyeron la misma fila pueden ganar ese UPDATE. No compara versión/attempts/owner ni renueva la edad usada para detectar stale. El setInterval tampoco impide solapar barridos que tarden más de dos minutos. El gate de líder no elimina la superposición dentro del mismo proceso ni el trabajo previo a un failover.

**Corrección:** claim mediante lease/versión y CAS real, timestamp del intento, propietario y finalización condicionada al claim vigente. Añadir exclusión del barrido local y preservar idempotencia de los efectos. No se demostró doble cobro; se demuestra que la exclusión declarada no se sostiene para pending.

### OPS-07 · Media — apagado y manejo de fallos no están acotados globalmente

**Evidencia:** [backend/src/core/lifecycle.ts:50](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/lifecycle.ts:50), [docker-compose.prod.yml:132](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/docker-compose.prod.yml:132) y [backend/src/core/queue/connection.ts:18](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/queue/connection.ts:18).

Cada hook dispone de diez segundos, pero Compose concede veinte segundos al proceso completo. Varios hooks lentos pueden agotar la gracia antes de cerrar colas y DB. El timeout se resuelve como éxito y no cancela el hook: aparece “hook ok” aunque siga ejecutándose.

Las conexiones de productores BullMQ también usan reintentos ilimitados; una indisponibilidad de Redis puede mantener enqueues pendientes. Los rechazos globales se loguean y se continúa, sin distinguir un fallo operacional de una violación de invariantes.

**Corrección:** deadline global, fases explícitas (dejar de admitir, detener productores, drenar consumidores, cerrar clientes), resultado separado para timeout/error/éxito, cancelación cuando sea posible y gracia consistente. Configurar productores para fallar en un plazo acotado y reservar persistencia de conexión para consumidores. [BullMQ: conexiones](https://docs.bullmq.io/guide/connections).

### CI-01 · Alta para garantías de entrega — condición inválida y pruebas de integración fuera del gate

**Evidencia:** [.github/workflows/ci.yml:121](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/.github/workflows/ci.yml:121).

`jobs.smoke-full.if` usa `secrets.CI_DISCORD_TOKEN`. El contexto secrets no está disponible en esa condición de job. La configuración puede ser rechazada como workflow inválido; no se comprobó el estado remoto de Actions. [Referencia oficial](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

La ruta normal ejecuta tests unitarios, pero no `test:integration` con Postgres/Redis reales. El smoke descrito comprueba salud, no entrega efectiva de un job. Por eso no cubre la semántica de BullMQ ni las carreras de DB observadas.

**Corrección:** condicionar el job con variables/contextos soportados y comprobar presencia de secretos dentro de pasos usando env; gate de integración con servicios descartables. El primer escenario debe enviar una ocurrencia a un destino simulado, provocar fallo/retry y comprobar recuperación sin duplicados.

## Otros hallazgos y deuda que sí priorizaría

- **Rate limit anterior a autenticación:** [backend/src/core/http/rateLimit.ts:25](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/http/rateLimit.ts:25) deriva la clave de cualquier cookie presentada, antes de validarla. Rotar cookies falsas permite cambiar de bucket y generar trabajo de lookup de sesiones/Redis. No permite autenticarse, pero debilita el límite del borde. Aplicar primero un límite por IP normalizada/subred y después por identidad validada. Mantener el límite por guild ya autorizado.
- **Refresh OAuth:** [backend/src/core/auth/discordUser.ts:23](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/auth/discordUser.ts:23) no coordina renovaciones de la misma sesión entre requests/réplicas; ante 429/5xx el refresh devuelve null y el 401 original puede provocar borrado de sesión. Añadir single-flight/CAS distribuido, timeouts y clasificación de errores; no borrar sesiones por una caída transitoria.
- **Cuota de uploads no atómica:** [backend/src/lib/uploadedAssets.ts:33](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/lib/uploadedAssets.ts:33) consulta el total antes del write y el insert posterior no vuelve a imponerlo. Con chunked, incomingBytes puede ser cero; uploads concurrentes pueden superar cuotas. Reservar capacidad de forma atómica y contabilizar bytes reales, con compensación al fallar.
- **Adjuntos locales mal tipados:** [backend/src/lib/embedMedia.ts:59](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/lib/embedMedia.ts:59) crea AttachmentBuilder desde un path, pero [backend/src/core/discord/outgoing.ts:13](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/discord/outgoing.ts:13) lo fuerza a Buffer por cast. El REST instalado convierte strings en contenido textual del archivo: puede enviarse el path en vez de la imagen. Esto corrige una sospecha inicial: el recorrido REST de embeds no demostró exfiltración del contenido del archivo; la vía de lectura entre guilds confirmada es SEC-02. Cargar/streaming tipado y verificar propiedad antes de producir bytes.
- **Menciones en REST:** [backend/src/core/discord/baseGateway/messaging.ts:60](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/discord/baseGateway/messaging.ts:60) pasa allowedMentions opcional. El default `parse: []` del Client de discord.js no protege automáticamente este cliente REST independiente. Establecer el default seguro en el puerto y autorizar excepciones.
- **Caché y memoria:** [backend/src/core/cache/redisStore.ts:50](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/core/cache/redisStore.ts:50) siempre carga L1 con 30 segundos aunque el TTL solicitado/remaining en L2 sea menor; una entrada casi vencida puede prolongarse. [backend/src/modules/levels/liveLeaderboard.ts:19](/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source/backend/src/modules/levels/liveLeaderboard.ts:19) conserva mapas por guild y timers sin una rutina de eliminación del guild. Son deuda de semántica de caché y retención; su impacto requiere pruebas prolongadas.
- **Privilegios de infraestructura:** todos los roles de aplicación reciben el mismo env_file; la conexión de app y migraciones usa el usuario de inicialización de PostgreSQL del Compose. Separar credenciales y privilegios, restringir Redis por ACL/red, fijar recursos por proceso y documentar rotación. El runner hereda compiladores de la etapa base: separar una base mínima de runtime.
- **Política de supply chain:** SBOM y scans ya existen, pero el gate de severidad critical deja pasar high del backend. Definir excepciones con propietario/expiración y decisiones por alcanzabilidad. Fijar también acciones que siguen por tag. Corregir CI-01 antes de atribuir garantías a esos controles.

## Lo que está bien y conviene conservar

1. **Kernel y módulos separados**, contratos compartidos y roles api/gateway/worker. Es una buena base para aislar despliegues sin fragmentar el dominio en microservicios prematuramente.
2. **Puerto BotGateway** que permite simular Discord. Las pruebas de esta auditoría pudieron atravesar código real sin enviar mensajes gracias a ese diseño.
3. **Sesiones opacas de alta entropía**, hash del token en DB, cifrado AES-GCM de access/refresh tokens y cookies HttpOnly/Secure en producción. State de OAuth con consumo atómico y PKCE son controles correctos que necesitan el vínculo de navegador adicional.
4. **Autorización server-side de guild**, permisos específicos en parte de los módulos, canonicalización del guild y esquemas de entrada. El problema principal es la aplicación incompleta de esas políticas.
5. **Claims SQL atómicos y SKIP LOCKED**, separación de migraciones del arranque normal, pools con límites y statement_timeout.
6. **Inbox de webhooks, verificación de firma raw y compensación de compras.** La existencia de `needs_reconciliation` es mejor que dar un reembolso ficticio cuando no pudo deshacerse un premio.
7. **Cachés acotadas, sweepers de Discord, worker threads, logs estructurados con redacción y métricas.** Hay intención clara de operar el servicio a largo plazo.
8. **Tests, lint de límites de importación, imágenes fijadas por digest y SBOM.** El package.json actual ya aplica lint a todo backend/src y shared; la nota antigua de AGENTS.md que lo limita al core está desactualizada.

## Arquitectura recomendada

Mantendría un monolito modular con tres procesos. El principal cambio no es añadir carpetas o un framework: es hacer explícita la autoridad y la propiedad en los límites.

- **Autorización centralizada por acción y recurso.** Un AuthorizedGuildContext debe incluir actor, guild y política; las operaciones reciben recursos validados para ese contexto. Los IDs de canal o asset sin validar no deberían llegar a un método privilegiado. Los branded types ayudan al compilador, pero deben ser emitidos tras una comprobación runtime.
- **Composición explícita de adaptadores.** Conservar el puerto, pero reducir la profundidad de mixins o hacer delegados de capacidades con dependencias claras. Una misma suite debe verificar invariantes de seguridad y comportamiento en RestGateway y LocalClientGateway.
- **Persistencia de ocurrencias y outbox/inbox.** Separar estado de negocio, publicación en cola, intento de entrega y recibo externo. El claim en DB y `queue.add` no forman una transacción; el outbox permite recuperar la publicación. Para envíos cuyo resultado quedó incierto, definir política de duplicados y reconciliación.
- **Backpressure como requisito.** Límites de admisión por guild y proceso, plazos, cancelación y métricas de edad de cola, renders pendientes, timeouts y jobs huérfanos. Un límite de concurrencia no sustituye un límite de cola.
- **Resiliencia verificable.** Tests con Redis/Postgres efímeros, pausas del líder, cortes de Redis, error/exit de workers y SIGTERM. Medir heap, memoria externa/nativa, handles activos y conexiones después de que la carga vuelva a cero.
- **Documentación de invariantes.** Actualizar AGENTS/README sobre migraciones, lint, roles y garantías de entrega. Evitar comentarios como “nunca duplica” o “SSRF bloqueado” sin pruebas que cubran la afirmación.

## Orden de ejecución propuesto

**Antes de exponer o ampliar uso multiusuario:** SEC-01, SEC-02, SEC-03 y SEC-04; verificar con dos guilds ficticios y roles actor/bot distintos. Después SEC-05 y SEC-06.

**Antes de confiar en automatizaciones:** OPS-01 y OPS-02 con Redis real; OPS-03 con workers simulados que fallan o no responden; reparar CI-01 y hacer bloqueantes esas regresiones.

**Siguiente iteración operativa:** fencing/claims, reconciliación, apagado global, cuotas y refresh; límites de recursos, mínimos privilegios y pruebas prolongadas.

Criterio de cierre: ninguna operación puede usar recursos de otro guild, ninguna función puede prestar permisos del bot por encima de la autoridad del actor, y cada fallo inyectado termina en éxito, error explícito o estado recuperable persistente. Las promesas sin resolución y los jobs silenciosamente ignorados deben ser cero en esos escenarios.

