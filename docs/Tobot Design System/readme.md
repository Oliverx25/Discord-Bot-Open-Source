# Tobot — Design System

**Marca:** Tobot (antes «Adobos Bot»). Bot de Discord modular con panel web, pivotando a SaaS.
**Idioma:** esta guía y **ambos UI kits están en español** (público principal: comunidades hispanohablantes). El inglés es la traducción secundaria; las reglas de voz de §2 aplican igual a los dos idiomas y los ejemplos se dan en ambos.

---

## 1. Contexto de producto

Tobot es un único proceso Node que mantiene el WebSocket del gateway de Discord y sirve el dashboard a la vez. Nació self-hosted para el servidor «Adobos» (comunidad en torno a la cantante ADO) y hoy es un producto real con 18 módulos en producción.

**Los 18 módulos:** mensajes y embeds con constructor visual · tarjetas de bienvenida/despedida/ban/boost renderizadas con canvas · autoroles por reacción · botones y menús · action logs granulares con enrutado por canal y webhooks · auto-mod con filtros y castigos escalonados · auto-borrado programado · formularios vía modales · mensajes programados con zona horaria por mensaje · comandos custom · niveles con XP de texto y voz · economía con banco, trabajos y tienda · casino (ruleta, blackjack, coinflip) · moderación con auditoría de Discord · constructor de roles · plugin de Pokémon (PokéAPI + Smogon) · webhooks · estadísticas de servidor.

**Público:** administradores de comunidades medianas (gaming, creadores, comunidades hispanohablantes) que hoy instalan entre cinco y diez bots y pagan suscripciones separadas por cada uno.

**Diferenciador comercial:** todos los competidores cobran **por servidor**. Tobot cobra **por cuenta**: una suscripción cubre todos los servidores que administres. Esa frase es el centro de la marca, no un bullet de pricing.

### Superficies representadas aquí
| Superficie | Carpeta | Modo |
| --- | --- | --- |
| Landing / marketing | `ui_kits/marketing/` | solo dark |
| Dashboard de producto | `ui_kits/dashboard/` | dark primario, light soportado |

### Fuentes recibidas
- Un único brief de texto (descripción de producto + encargo de branding), pegado en el chat el 27 ago 2026.
- **No se entregó** código, repo de GitHub, archivo de Figma, capturas ni logo. Todo lo visual de este sistema es original y creado desde cero para este brief. Si existe repositorio o Figma, adjúntalos y reconstruyo tokens y UI kits contra la fuente real.
- **No existe logotipo ni símbolo de marca.** Donde iría una marca se compone el nombre en tipografía (`tobot.` en Archivo 800). No hay imagotipo dibujado: hace falta diseñarlo aparte.

---

## 2. CONTENT FUNDAMENTALS — cómo se escribe

**Vibe:** un admin veterano explicándole algo a otro admin. Concreto, tranquilo, sin humo. Nunca «revoluciona tu comunidad».

- **Persona:** segunda persona («tus servidores», «lo que ya tienes»). Primera del plural solo para hablar de decisiones propias («decidimos cobrar por cuenta»). Nunca «los usuarios».
- **Casing:** *sentence case* en todo — titulares, botones, labels, badges de nav. Mayúsculas solo en overlines de sección (11px, tracking .14em) y en los nombres de evento de los logs (`AUTOMOD`, `MSG_DELETE`).
- **Puntuación:** punto final en frases completas, también en subtítulos de card. Cero signos de exclamación. Guion largo con moderación. Sin puntos suspensivos ansiosos.
- **Cifras:** siempre en mono y siempre reales. «15 de 18 módulos», «412 mensajes filtrados · 30d», «$6/mo». Nunca «miles de» ni «hasta un X% más rápido».
- **Emoji:** no. En ninguna superficie: ni landing, ni dashboard, ni emails, ni changelog. Es el gesto más rápido para no parecer «bot de gamers».
- **Términos de Discord** se escriben como los escribe Discord y en mono: `#mod-log`, `@Moderator`, `/tobot economy`.
- **Longitudes:** titular ≤ 8 palabras. Subhero ≤ 2 frases. Descripción de módulo ≤ 6 palabras. Error: qué pasó + qué hacer, en una frase cada cosa.

### Ejemplos reales
| Superficie | Copy |
| --- | --- |
| Hero | «Six bots do the work. One of them should be enough.» / «Seis bots hacen el trabajo. Con uno debería bastar.» |
| Subhero | «Tobot runs moderation, logs, welcomes, levels, economy, forms and automation from one place — and one subscription covers every server you run, not one.» |
| CTA | «Add to Discord — free» / «Añadir a Discord — gratis» |
| Error | «Discord turned down that webhook (401). Re-link the channel and we'll retry the queued events.» |
| Estado vacío | «Nothing is on yet — that's on purpose. Turn on one module, watch it work, then add the next.» |
| Pricing | «Free covers 15 of 18 modules, on every server you run. Per account, not per server.» |
| Tweet | «Five bots to say hello, hand out a role and log a delete. We think that's four bots too many.» |

**Prohibido:** «potencia», «lleva tu comunidad al siguiente nivel», «impulsado por IA», «all-in-one solution», signos de exclamación, emoji, mayúsculas gritadas, «simplemente» / «solo tienes que».

---

## 3. VISUAL FOUNDATIONS

**Territorio: terminal ácido.** Carbón casi negro con tinte verde, un solo color de marca (ácido fósforo), retículas de 56px, secciones numeradas, mono en mayúsculas para labels y cifras, y botones físicos con sombra dura. Deliberadamente lejos del blurple/neón de la competencia y del look «IA 2026» (mesh morado-azul, glass global, blobs). Referencias de ejecución aportadas por el cliente: rubenmarcus.dev y terminal-industries.com.

- **Color.** Marca **Ácido `#C6FF3D`** (siempre con tinta `#0B0F08` encima, nunca blanco), sombra dura `#5E7F19`. Secundario **Jade `#3ECF8E`** solo para éxito y datos positivos. Neutros «Carbón» verdosos (hue ~100°): base `#080A08`, surface `#0E120D`, raised `#141911`, inset `#050705`. Light: `#EFF2E9`. Estados: jade / ámbar / chile; **info es neutro — no hay azul ni violeta en el sistema**. El ácido nunca marca un estado: solo acción y marca.
- **Modo primario:** dark. Light es un puerto (`[data-theme="light"]`).
- **Tipografía.** Archivo (display, 700–800, tracking -0.02 a -0.05em) · Karla (body/UI) · JetBrains Mono, que aquí carga mucho más peso: labels, overlines, cifras, badges, etiquetas de botón y todo lo que pertenece a Discord.
- **Espaciado.** Rejilla de 4px. Marketing `--section-y` 96px / gutter 24px; dashboard `--dash-pad` 20px / gaps 12px.
- **Radios.** Duro y técnico: 2 / 3 / 4 / 6 / 10px. Nada por encima de 10. La **pill está reservada a badges de estado y tier**.
- **Bordes.** 1px es el material estructural: `--border-subtle #1E2519`, `--border-default #2C351F`, `--border-strong #465232`. Las cards en rejilla se separan con gaps de 1px sobre el color de borde, no con sombras.
- **Sombras — dos sistemas separados.** (1) **Sombra dura**: offset sólido de 4px sin blur (`--shadow-hard`) en todo lo pulsable; al hover se acorta a 2px y el elemento se desplaza; al pulsar toca fondo. Es la firma táctil de la marca. (2) **Difusa**: solo para lo que flota — `shadow-1` barras sticky, `shadow-2` toast/menú, `shadow-3` modal.
- **Cards.** `--bg-surface`, borde 1px subtle, radio 6px, sin sombra. Card activa: borde `rgba(198,255,61,.30)`. Card destacada (`tone="accent"`): fondo ácido al 10% + borde ácido.
- **Fondos y textura.** Dos recursos y nada más: el **gradiente tramado** y el **ticker**. El gradiente tramado (`.tobot-dither`) es un degradado ácido a 105° cuantizado por una trama de puntos de 3px — hay degradado, pero pixelado a 1 bit, así que se lee como render de máquina y no como mesh de IA. Intensidad por defecto `--dither-alpha: .22`; `.tobot-dither-quiet` (.12) para fondos largos y `.tobot-dither-strong` (.38) para piezas de campaña. **Solo en hero, fondo de landing y modales** — nunca en el dashboard ni detrás de tablas, donde compite con el mono. El ticker es la marquesina ácida de 30px, mayúsculas mono, separadores `✦`, una por página. Sin imágenes de stock, sin ruido, sin mesh, y **sin la retícula de 56px** (retirada por genérica).
- **Transparencia y blur.** Nav sticky `rgba(8,10,8,.88)` + blur 6px, scrim de modal `rgba(5,7,5,.75)`, y el **modal es el único sitio donde se permite vidrio** (blur 18px + borde luminoso). Nunca como estética global.
- **Animación.** Rápida y funcional: 80ms press, 140ms hover/switch, 200ms entrada de panel/toast, 320ms cambios de layout, 520ms celebración (única vez). Easing por defecto `cubic-bezier(.4,0,.2,1)`; entradas `--ease-out`; press y switch `--ease-snap`; rebote `--ease-spring` solo en celebración. Nada hace loop salvo el ticker.
- **Hover.** El ácido sube a `#D6FF66`; lo pulsable se desplaza 2px hacia su sombra; las superficies usan `--bg-hover` (blanco verdoso al 4.5%); los bordes secundarios pasan a ácido. Nunca opacidad global, nunca glow difuso (el glow existe solo como `--shadow-glow` para el foco de un elemento de vidrio).
- **Press.** Desplazamiento de 4px con la sombra a cero en lo físico; `scale(.985)` en lo que no lleva sombra (ghost).
- **Focus.** `--ring-focus`: 2px de fondo + 4px ácido. Siempre visible.
- **Layout fijo.** Landing: ticker 30px + nav sticky 62px, contenido a 1200px, medida ≤ 68 caracteres, secciones numeradas `01 /`. Dashboard: rail 56px + sidebar 248px + topbar 56px fijos; solo el panel central hace scroll.
- **Imágenes.** El sistema no depende de fotografía. Las tarjetas que renderiza el bot se muestran en un well `--bg-inset` con borde 1px y radio 4px, sin tratamiento de color.

## 4. ICONOGRAPHY

- **Librería: Lucide** (`https://unpkg.com/lucide@0.469.0`), trazo 2px, tamaños 13 / 16 / 18 / 20px, línea pura. **Sustitución declarada:** no se entregó set propio; Lucide es la coincidencia más cercana al carácter técnico del sistema. Si aparece un set propio, sustitúyelo conservando los tamaños.
- **Nunca:** iconos rellenos, duotone, con degradado, ni en círculos de color (excepto el well de 32px de `ModuleCard`).
- **Un glyph por módulo**, fijo en todo el producto: embeds `message-square` · tarjetas `image` · autoroles `user-plus` · botones `mouse-pointer-click` · logs `scroll-text` · auto-mod `shield-alert` · auto-borrado `timer` · formularios `clipboard-list` · programados `calendar-clock` · comandos `terminal` · niveles `trending-up` · economía `coins` · casino `dices` · moderación `gavel` · roles `users-round` · Pokémon `swords` · webhooks `webhook` · stats `bar-chart-3`.
- **Mascota:** sí, **TO** — spec en `guidelines/mascot.md`, boceto de construcción en `assets/tobot-mascot-construction.svg`. Su cara son caracteres mono reales (`◕ ◕ / ▿`), reutilizables en un embed de Discord.
- **Emoji:** no. Los únicos caracteres unicode admitidos como grafismo son `×` (cerrar), `▾` (chevron del select) y `✦` (separador del ticker), más los glifos de la cara de TO.
- **Assets:** `assets/tobot-mascot-construction.svg` es un **boceto de especificación**, no arte final. Sigue sin haber logo dibujado: el logotipo es tipografía pura.

## 5. Componentes

Sistema autoral (no había inventario de origen), **34 primitivos**:

**core/** — `Button`, `IconButton`, `Card`, `Badge`, `Tag`
**forms/** — `Input`, `Select`, `Checkbox`, `Radio`, `Switch`, `ChannelPicker`, `Slider`, `TimezoneSelect`
**feedback/** — `Dialog`, `Toast`, `Tooltip`, `Alert`, `EmptyState`, `Skeleton`
**navigation/** — `Tabs`, `NavItem`, `Menu`, `Accordion`, `Stepper`, `CommandPalette`
**data/** — `Table`, `LogRow`, `Stat`, `Progress`, `Avatar`
**marketing/** — `Ticker`, `PricingTier`
**product/** — `ModuleCard`, `EmbedPreview`

Cada carpeta trae `<Name>.jsx`, `<Name>.d.ts` y `<Name>.prompt.md`, más una card de la pestaña Design System.

### Adiciones intencionadas (fuera del set genérico)
- **`NavItem`** — el dashboard tiene navegación lateral permanente.
- **`ModuleCard`** — la rejilla de 18 módulos es la pantalla principal del producto.
- **`ChannelPicker`** — Discord se navega por `#canal` y `@rol`; es el control más usado del panel y ningún combobox genérico lo resuelve bien.
- **`TimezoneSelect`** — Tobot guarda zona horaria **por mensaje**; el selector aparece junto a cada campo de programación.
- **`EmbedPreview`** — el constructor visual de embeds necesita ver el resultado; es la única superficie donde entra un color arbitrario elegido por el usuario.
- **`LogRow`** — los action logs son el módulo más usado; la severidad viaja en el color del nombre del evento.
- **`Ticker`** — elemento de marca, no decoración.
- **`CommandPalette`** — 18 módulos × N servidores hacen que la navegación por sidebar no baste.

### Plantillas
`templates/dashboard-page/` y `templates/landing-page/`: dos puntos de partida completos (`.dc.html` + `ds-base.js`) que otros proyectos pueden copiar y editar.

## 6. Índice del repositorio

| Ruta | Qué es |
| --- | --- |
| `styles.css` | único punto de entrada: solo `@import` |
| `tokens/` | `fonts`, `colors`, `typography`, `spacing`, `radius`, `shadows`, `motion`, `base` |
| `guidelines/brand-strategy.md` | naming, arquetipo, voz, diferenciación, motion, landing, dashboard, mini brand guideline |
| `guidelines/*.html` | specimen cards (Colors, Type, Spacing, Shape, Motion, Brand) |
| `guidelines/mascot.md` | spec completa de TO: construcción, paleta, expresiones, poses, prompt de imagen |
| `explorations/` | las dos direcciones exploradas antes de fijar la actual (A ganó) |
| `components/` | los 16 primitivos + sus cards |
| `ui_kits/marketing/` | landing completa, click-through |
| `ui_kits/dashboard/` | 4 pantallas de producto, click-through, más `states.html` (404, 500, vacío, error de pago, modo light, carga) |
| `templates/` | plantillas listas para copiar: página de dashboard y landing |
| `thumbnail.html` | tile del sistema |
| `SKILL.md` | envoltorio para usar esto como Agent Skill |

**Nota de dirección:** la primera versión de este sistema usaba una paleta ember/agave; se descartó por genérica. La dirección vigente es **terminal ácido** (ver `explorations/`).

**Fuentes:** Archivo, Karla y JetBrains Mono se cargan desde Google Fonts vía `@import` en `tokens/fonts.css`. No hay ficheros de fuente locales; si la marca licencia tipografías propias, sustitúyelas ahí.
