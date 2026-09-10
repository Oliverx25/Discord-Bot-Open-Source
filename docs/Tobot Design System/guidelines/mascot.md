# TO — la mascota de Tobot

Nombre: **TO** (se lee «to», las dos primeras letras del logotipo). Género: ninguno, se le llama «TO» o «el TO».

## Qué es
Un **terminal portátil con vida propia**: una carcasa de plástico mate con una pantalla de fósforo verde donde vive su cara. No es un robot humanoide, no es una IA amigable de 2026, no es una criatura peluda. Es el aparato que un administrador de comunidad tendría en el bolsillo — un pager de los 80 que se despertó y decidió ayudar.

**Por qué esta idea y no un robot:** los competidores (MEE6, ProBot) ya tienen mascota robot 3D brillante; ahí perdemos por comparación. Un objeto-herramienta con cara conecta con el arquetipo del Cuidador (está para trabajar, no para entretener), con la dirección visual «terminal ácido», y con el detalle que ya funciona en producto: **la cara de TO es literalmente la carita ASCII que se puede pegar en un mensaje de Discord**. Marca y producto usan el mismo activo.

**Medio:** TO se produce como **objeto 3D renderizado** (no vector plano). Luz de estudio suave, materiales mate reales, sin fotorrealismo excesivo — sigue siendo una mascota de marca, no un asset cinemático.

## Especificaciones de construcción
Ver `assets/tobot-mascot-construction.svg` (boceto geométrico de referencia de proporciones; el arte final es 3D).

| Elemento | Spec |
| --- | --- |
| Cuerpo | **Solo cabeza-pantalla** — no hay torso separado. La carcasa de la pantalla ES el cuerpo entero, con un pequeño mentón/base redondeada justo debajo donde se insertan los brazos. Cuadrado de 240 × 240 unidades, radio 26. |
| Pantalla | 184 × 120 (77 % del ancho), radio 14, centrada en el tercio superior. Vidrio con leve curvatura CRT y líneas de escaneo sutiles. |
| Cara | Los glifos (`#C6FF3D`) flotan sobre un **ráster verde de fondo siempre encendido**, con líneas de escaneo densas — la pantalla nunca está totalmente apagada, ni en `sleep`. Glow real (bloom suave). Nunca se sale del marco. |
| Antena | 26 unidades de alto, trazo 6, bulbo r9. **Se retrae dentro de la carcasa en `sleep` y se extiende al despertar** (gesto de hero, una sola vez al cargar). Extendida en el resto de estados; el bulbo se enciende según la tabla de expresiones. |
| Brazos | Dos trazos redondeados de grosor 8, **saliendo de los costados bajos de la carcasa** (no del mentón central), terminados en **esfera con pinza de dos dedos** (no puño cerrado) — permite señalar, sostener, abrirse. |
| Piernas | No tiene. Flota a 30-40 unidades del suelo. |
| Mentón | Cápsula redondeada bajo la pantalla con un emisor verde en la base — es el origen físico de las ondas de flotación, no magia sin explicación. |
| Sombra / flotación | En vez de una elipse plana: **ondas concéntricas ácidas** que se expanden desde el emisor del mentón, como si levitara sobre una superficie reflectante. Se desvanecen hacia afuera; la onda central es la más brillante. |
| Materiales | Carcasa en **dos tonos con jerarquía**: marco frontal carbón (más oscuro, enmarca la pantalla) + concha lateral/trasera gris hueso (más clara, envuelve el volumen). Mate con micro-desgaste y variación de rugosidad — nunca gloss, nunca un gris uniforme de un solo tono. Juntas de panel visibles; rejilla de ranuras en el costado derecho. |
| Escala mínima | 48 px de alto en pantalla; por debajo se usa solo la cara ASCII. |

**Pendiente:** fijar los hex exactos de carbón y hueso con cuentagotas sobre el render de referencia — no usar valores de memoria.

## Paleta de la mascota
| Zona | Color |
| --- | --- |
| Marco frontal | Carbón — `TODO: hex por confirmar` |
| Concha lateral/trasera | Gris hueso — `TODO: hex por confirmar` |
| Pantalla (ráster de fondo, siempre encendido) | Verde apagado — mismo verde del render, tenue incluso en `sleep` |
| Fósforo (glifos de la cara, antena, ondas) | `#C6FF3D` |
| Brazos y pinzas | Gris hueso, igual que la concha |
| Ondas de flotación | `#C6FF3D`, opacidad decreciente de 25 % (onda central) a 0 % (borde exterior) |

Nunca en morado, azul, cromado, degradados de dos colores, ni gris uniforme de un solo tono — el carbón y el hueso deben leerse como dos materiales con jerarquía, no como "gris genérico".

## Personalidad visual
Atento, económico de gestos, algo formal. No salta, no guiña, no hace el payaso. Su rango emocional es el de un compañero de turno de noche: concentrado, satisfecho cuando algo sale bien, preocupado cuando algo falla, dormido cuando lo apagas.

## Expresiones canónicas
La cara se construye con **formas geométricas simples** (barras redondeadas, círculos) que renderizan bien en 3D, pero cada estado tiene un carácter ASCII equivalente para su uso plano en Discord y en contextos de solo texto — mismo mapa de estados, dos ejecuciones.

| Estado | Antena | Cuándo |
| --- | --- | --- |
| `idle` | extendida, apagada | reposo, hero, avatar |
| `work` | extendida, parpadeo ácido | loading, guardando |
| `ok` | extendida, fija ácido | confirmación, celebración |
| `alert` | extendida, ámbar | error, permiso faltante |
| `sleep` | **retraída**, apagada | módulo desactivado, 404 |

**Pendiente — rediseño de las 5 caras:** el render actual mezcla ojos de `work` con boca de `idle`; el set de 5 formas (ojos + boca + ASCII equivalente) por estado necesita una sesión aparte, dibujadas juntas y comparadas a 48 px sin color — cada estado debe distinguirse por forma sola, no solo por el color de la antena.

## Poses clave (para encargar ilustración)
1. **De pie, de frente, idle** — la pose maestra. Brazos relajados, flotando, ondas de flotación visibles debajo. Es el avatar y el 404.
2. **Trabajando** — inclinado 8°, un brazo señalando fuera del marco, antena encendida. Empty state de un módulo sin configurar.
3. **Vigilando** — visto desde abajo, flotando alto, pantalla en `idle`, ondas de flotación amplias. Sección de auto-mod / seguridad.
4. **Dormido** — flotando muy bajo, casi sin ondas, pantalla `sleep`, antena caída. Nunca posado sobre una base o superficie: TO siempre flota, incluso dormido. Módulo apagado, error 500.
5. **Celebración** — un solo confeti de un carácter (`✦`) sobre la pantalla, cara `ok`. Primer comando ejecutado, una vez.

## Dónde aparece
Onboarding · estados vacíos · 404 y 500 · loading de más de 2 s · celebración del primer comando · avatar del bot en Discord · redes sociales.

## Dónde NO aparece
Facturación y pricing · errores de pago · tablas de logs y de datos · dashboards densos · documentación legal · cualquier pantalla donde el usuario esté resolviendo un problema serio. En el producto, TO es la excepción; la regla es la interfaz sin cara.

## Prompt de partida para generación de imagen
> 3D render character sheet of "TO", a small floating handheld-terminal creature made of ONE piece: a rounded matte dark-olive plastic screen-head (no separate body/torso) with a small rounded chin underneath where two thin dark-olive arms attach, ending in small rounded fists, no legs. The screen is dark glass filling most of the front face, showing a soft acid-green phosphor glow face (rounded bar eyes, small circle mouth) with subtle CRT scanlines. A short thin antenna on top with a small acid-green glowing bulb. TO floats slightly above the ground; underneath it, faint acid-green concentric ripple rings glow on the surface, fading outward. Soft studio lighting, matte plastic material, no chrome, no gloss, no gradients beyond the screen glow. Palette strictly: #141911 case, #465232 outline/seams, #050705 screen glass, #C6FF3D phosphor glow and ripples, background dark neutral #080A08. Front view, full body, centered, neutral idle expression, nothing underneath it touching the ground.

Ajusta la última frase por pose. Mantén la paleta literal en el prompt: es lo que impide que el generador la desvíe hacia gris-arena genérico o azul. Insiste explícitamente en «floating, nothing touching the ground» — los generadores de video/3D tienden a resolver la pose final apoyando la mascota en una base, que no es parte del diseño.

## Aviso
El SVG de `assets/` es un **boceto de construcción con proporciones y colores**, no arte final. La ilustración definitiva debe hacerla una persona o un generador de imagen usando este documento como brief.
