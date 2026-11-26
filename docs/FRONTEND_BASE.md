# FRONTEND_BASE.md — Bases y directivas de estilo del frontend Olimpo

Fuente de verdad visual para `front/`. Cualquier cambio de identidad se documenta aquí primero y luego se replica en código. Estilo visual final aprobado para V1.0.0. Última actualización: 2026-11-25 (v1.0.4 — módulo de usuarios y roles en `/users`; enlace para saltar al contenido en el shell).

---

## 0. Directivas de estilo (obligatorias)

Estas reglas mandan sobre cualquier preferencia estética y se aplican a todo el frontend, mockups incluidos:

1. **El fondo siempre es oscuro.** Las superficies usan negro cálido (`--bg`, `--panel`, `--panel-2`). El dorado y los tintes semánticos se reservan para acciones, estados y acentos pequeños; inventario admite un tinte oscuro y discreto por categoría.
2. **Separación por borde; acciones legibles.** La separación estructural usa borde neutro de 1px (`--line` / `--line-strong`). Las acciones secundarias usan dorado tenue; la principal, dorado pleno con texto `--gold-ink`; las destructivas usan un tinte rojo discreto. Todos conservan borde, foco visible y radio de control (8px).
3. **Errores de campo junto al campo; errores globales como pops.** La validación local y los errores de campo reconocidos del backend usan un mensaje pequeño bajo el input, texto e icono rojos y borde rojo en el campo; se limpian al editarlo. Errores de negocio, sesión, red y servidor sin campo asociado usan un **toast** flotante (superficie negra, borde neutro, icono de color, título + recuperación). No usar banners ni fondos rojos. Si el backend rechaza credenciales sin identificar cuál, se muestra el toast y se marcan correo y contraseña.
4. **La información no satura.** La jerarquía prioriza la información necesaria para operar; los directorios pueden acompañarse con un resumen lateral. La ficha de cliente presenta sus secciones en tarjetas responsive. Evitar duplicar datos y acentos decorativos.
5. **Gradientes solo en tarjetas de clientes.** El resto de la interfaz no usa gradientes en fondos, botones, texto ni tarjetas. Las cards de clientes pueden usar un degradado casi imperceptible que avanza de transparente a dorado de izquierda a derecha; debe seguir leyendo primero como negro.
6. **Chips de estado solo borde; lo sano se calla.** El estado se codifica con un **chip sin fondo**: borde de 1px del color semántico pleno (`--success`, `--warning`, `--danger`) y texto del mismo color; radio de control (8px), sin pill y sin relleno. La información nunca depende solo del color: punto de 6px + texto. **El estado saludable (stock sano, activo, disponible) se muestra en reposo**: borde `--line`, texto `--text-muted` y solo el punto en verde; únicamente las excepciones (cerca del mínimo, bajo, deshabilitado, en mantenimiento) usan el color semántico pleno. Las etiquetas de categoría y objetivo son neutras: borde `--line` y texto `--text-muted`, sin acento.
7. **Sin sombras en cards.** La elevación se declara una vez con el borde. La sombra queda reservada a capas flotantes (toast y modal).
8. **Navegación por rol dentro del menú de usuario.** El encabezado autenticado conserva la marca y un único control de usuario; sus acciones se agrupan por los roles de esa cuenta y cada enlace muestra su icono funcional. Tema, diseño de desarrollo y cierre de sesión también viven ahí. Nunca ilustraciones decorativas ni iconos rellenos.
9. **Acento dorado con disciplina.** Dorado en: marca, icono del enlace activo, icono de sección al pasar el cursor, relleno tenue de acciones (regla 2), relleno pleno solo de la acción principal, foco y cifras clave. Nunca como relleno de contenedores grandes.
10. **Densidad y aire.** Padding de página 56/32, separación entre bloques 24–32 y paneles con padding consistente. Los filtros forman una fila compacta con nombre accesible y placeholder. En escritorio, la información operativa puede combinar un directorio con un resumen lateral; en móvil se apila sin perder contenido.
11. **Directorios y fichas.** **Clientes**: filas oscuras y compactas con avatar, nombre, documento, celular, correo y estado. Cada fila abre `/clients/:id`; la ficha es una página independiente con identidad, membresía, datos, rutinas asignadas, historial y pagos en secciones responsive. **Inventario**: tarjetas oscuras con tinte discreto por categoría, icono, existencia, mínimo, estado y acceso a la ficha; el resumen destaca los ítems que requieren atención. La ficha del ítem ocupa una banda completa con la identidad a la izquierda y el stock a la derecha, y el historial de movimientos va debajo. **Máquinas**: tarjetas con nombre, marca/modelo, serie, estado y acciones; el resumen de estados acompaña el directorio. **Horarios**: la semana es un ledger de una sola columna con el día en un raíl a la izquierda y sus bloques a la derecha; el orden visible es lunes → domingo aunque la API conserve 1 = domingo … 7 = sábado. Cada bloque es una fila de hora inicial, hora final, estado y quitar; los días vacíos se comprimen a una línea con “Añadir”, y el alta vive en un panel aparte. **Rutinas**: catálogo en tarjetas con tipo y precio, ficha con asignaciones y estado, y vista “Mis rutinas” para `CLIENT`. **Usuarios**: directorio en filas oscuras (solo `ADMIN`) con avatar, datos de contacto, fecha de alta, chips de roles, estado, alta de cuentas de personal (bloqueando `CLIENT`) y edición de roles; las cuentas `CLIENT` enlazan conceptualmente a Clientes sin edición de roles. **Acciones destructivas**: eliminar vive en el pie del bloque o en la fila con un icono discreto y siempre pide confirmación en un diálogo nativo (Cancelar / Eliminar) antes de ejecutar; el ítem de inventario borra también su historial de movimientos.
12. **Identidad de color estable y categorías con icono.** La paleta no semántica vive en `tokens.css` (`--accent-blue`, `--accent-teal`, `--accent-violet`, `--accent-pink`) y `lib/colorIdentity.ts` asigna un acento estable por *hash*. En inventario, las categorías predeterminadas tienen iconografía lineal; una categoría libre recibe identidad estable e icono neutro. El estado conserva su color semántico y contraste, sin depender solo del color.

## 1. Identidad visual — "Negro editorial"

Dirección: un sistema de gestión que se lee como una publicación, no como un tablero de videojuego. Negro cálido, líneas finas, tipografía con jerarquía y un único ornamento griego.

- **Carácter olímpico de Olimpo**: la referencia helénica debe reconocerse en proporciones arquitectónicas, el glifo de columna dórica, el meandro y la serif editorial; reforzarla en superficies públicas sin convertir cada bloque en un templo ni recurrir a adornos genéricos de gimnasio.
- **Dark-first**: la app abre en oscuro. El tema claro existe con la misma estructura y reglas (papel cálido, sin rellenos tintados).
- **Motivo griego único**: el **meandro**, dibujado como línea dorada de 1px al 55% de opacidad. Aparece en el pie, el login, las cabeceras de página y el panel de membresía. Nada más.
- **Glifo de columna dórica** como marca (SVG propio; en React, `react-icons`/componente de marca).
- **Regla de tokens**: hex crudo prohibido fuera de `src/styles/tokens.css` (React) y de `styles.css :root` (mockup). En dark no se duplica con `dark:` — cambian los tokens.
- **Decisión 2026-11-12**: el mockup v3 (gradientes, chips rellenos, sidebar) queda descartado y se usa como anti-referencia. La dirección vigente es este v4.

### Tokens (dark = canónico)

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--bg` | `#080807` | `#f2f2f0` | fondo de la app |
| `--panel` | `#0d0d0b` | `#fafaf8` | paneles, toast, modal |
| `--panel-2` | `#111110` | `#f5f5f3` | inputs y selects |
| `--text` | `#ece9e2` | `#17150f` | contenido |
| `--text-muted` | `#a09c92` | `#5c584f` | secundario |
| `--text-faint` | `#8a867c` | `#6e6a60` | labels, metadatos |
| `--line` | `#262521` | `#dcdcd7` | borde de paneles y filas |
| `--line-strong` | `#3a3833` | `#c8c8c1` | inputs, botones, toast |
| `--gold` | `#d9b45c` | `#7a5f16` | marca, acento, foco |
| `--gold-strong` | `#eccd82` | `#634d0d` | hover y texto de acento |
| `--danger` | `#e08272` | `#a53c30` | icono de error, estado bajo |
| `--success` | `#86c79a` | `#2c6b45` | punto de estado activo, stock sano |
| `--warning` | `#d9a86a` | `#8a5a12` | punto por vencer, cerca del mínimo |
| `--gold-soft` | mix 14% | mix 14% | relleno tenue de acciones |
| `--gold-border` | mix 45% | mix 45% | borde de botones secundarios |
| `--accent-blue` / `--accent-teal` / `--accent-violet` / `--accent-pink` | `#8ab2e0` / `#7cc4b4` / `#ab97de` / `#dd9db4` | versiones más oscuras | paleta de identidad (hash por entidad) |

Los mixes se definen en `tokens.css` con `color-mix` sobre los tokens base (nunca hex crudo en componentes). Los chips no llevan fondo tintado: borde + texto del color (regla 6).

- **Superficies del navegador tematizadas**: selección dorada translúcida, `caret-color` dorado, scrollbars finos en `--line-strong` con hover dorado, `underline-offset` en enlaces y cifras `tabular-nums` en datos.
- **Foco**: anillo de 2px `--gold-strong` con offset 2. Siempre visible.
- **Ficha de cliente**: el directorio enlaza a una ficha independiente (regla 11). Identidad, membresía, datos, historial y pagos se presentan como secciones responsive; la membresía destaca el tiempo restante con una barra accesible.

## 2. Tipografía y forma

- **UI**: sans del sistema; títulos 600 con tracking `-0.02em`.
- **Cifras y nombres de plan**: serif (Palatino/Georgia) en peso 400 en superficies editoriales. Las métricas operativas del dashboard usan sans con énfasis moderado.
- **Cuerpo**: 14px, medida 65–75ch, `text-wrap: balance` en títulos.
- **Radios**: paneles 12px, controles 8px. Sin pills.
- **Escala**: 12 / 12.5 / 13 / 14 / 15 / 17 / 26–30 / 38. Sin más pasos.

## 3. Iconografía — línea, representativa, sin relleno

- **Sistema**: un sprite SVG inline en el mockup (`<symbol>` + `<use>`); en React, **`react-icons`** (`lu`) con los mismos significados. Un solo trazo: `1.7`, `stroke-linecap="round"`.
- **Qué se dibuja**: iconos representativos de la función o del dato — panel, clientes, membresías, pagos, inventario, horarios, correo, candado, teléfono, pin, documento, reloj, calendario, editar, refrescar, flecha, check, buscar, alerta, tema.
- **Dónde aparecen**: navegación, título de página, labels de métricas, cabeceras de panel, labels de datos, botones y controles con icono de entrada. Siempre acompañan a texto; nunca sustituyen la etiqueta.
- **Regla de color**: el icono hereda el color del texto. El dorado se reserva al enlace activo, al icono de sección en hover, al título de página y al icono del toast; `--danger` se usa en errores de campo y toasts de error. Prohibidos los iconos rellenos, multicolor o ilustrativos.
- **Tamaños**: 12–13px en labels densos, 14–16px en UI, 20–22px en marca y título de página.

## 4. Vocabulario de componentes (mockup v4)

| Componente | Patrón | Dónde se usa |
|---|---|---|
| `metric` | label uppercase con icono pequeño + cifra serif + delta en texto; sin card | Franja de resumen del panel |
| `statCard` | superficie `--panel` + borde 1px + icono en tile; label uppercase, cifra serif y delta; hover solo aclara borde e icono | Resumen del panel por rol |
| `panel` | superficie `--panel` + borde 1px + radio 12 + padding 24; el borde se aclara en hover | contenedor base |
| `panelHead` | icono 15px + título 15px + acción de texto, separados por hairline | cabecera de panel |
| `row` | hora / contenido / valor, filas con hairline | agenda, vencimientos |
| `dataTable` | header sin fondo, filas hairline, columnas alineadas | pagos, historial |
| `status` | punto de 6px + texto; color solo en el punto | membresía, cuenta |
| `tag` | borde 1px, sin relleno | etiquetas puntuales |
| `toast` | error global/de negocio: negro + borde + icono + título + recuperación | login, formularios, acciones |
| `fieldError` | mensaje pequeño con icono rojo bajo el input; el input asociado recibe borde rojo | validación local y errores del backend asociados a un campo |
| `modal` | `<dialog open>` + scrim, superficie negra | renovación |
| `clientCard` | avatar + nombre + correo + 3 datos + 2 acciones de texto | directorio de clientes |
| `membershipPanel` | plan en serif + fechas + meandro | ficha del cliente |
| `chart` | línea dorada sobre grid hairline | asistencia |
| `button` | outline; principal = borde y texto dorados; nunca relleno; icono 15px opcional | acciones |
| `input` | `--panel-2` + borde neutro/foco dorado; cuando es inválido, borde e icono rojos sin fondo tintado | formularios |
| `icon` | sprite SVG, trazo 1.7, hereda color; 12–22px | navegación, labels, botones |

`button`, `iconButton`, `modal`, `dataTable`, `tag`, `status` y `emptyState` se apoyan en Astryx; el wrapper de `components/ui` conserva las reglas v4 (bordes de 1px, sin rellenos) y el resto de primitivos sigue siendo propio.

## 5. Layout

- **Header** 68px sticky: marca y un menú de usuario compacto. Las acciones se agrupan por el conjunto de roles que permite cada ruta; preferencias y cierre de sesión están al pie del mismo menú. Las páginas públicas (`/`, `/login` y el 404 sin sesión) comparten el header de la home. El `appShell` incluye un enlace “Saltar al contenido” (`#contenido`) visible únicamente al navegar con teclado.
- **Página**: máx 1180px, padding 56/32, bloques separados por 24–32px.
- **panel**: tarjetas de resumen (3) → split principal/lateral 1.55fr/1fr → accesos rápidos en grid. Cada rol ve sus propios indicadores, paneles de trabajo y atajos; un rol sin datos para un bloque no lo muestra antes que inventarlo.
- **Login**: slider de dos pasos alineado a la izquierda: primero se elige el rol (lista vertical con icono, resumen y chevron) y la tarjeta se desliza al formulario de credenciales, cuyo título, resumen y pistas reaccionan al rol elegido. Un botón "Cambiar rol" regresa al paso 1.
- **Footer**: meandro + firma.
- Responsive: 1180 / 1020 / 820 / 560.

### Movimiento (vida sin ruido)

- **Navegación**: View Transitions de duración breve para cambios de página y elementos compartidos; las actualizaciones funcionan sin transición cuando el navegador no la admite o el usuario solicita movimiento reducido.
- **Trazo del gráfico**: la línea se dibuja de izquierda a derecha (1.2s) y los puntos aparecen después. Sin rebotes.
- **Capas flotantes**: toast y modal entran con la misma subida corta; el scrim funde en 0.3s.
- **Hover silencioso**: el borde del panel se aclara, el icono de sección pasa a dorado, el avatar de cliente se dora, el icono de tema rota 14° y el valor de fila se aclara.
- **Regla**: nada de movimiento continuo, parallax ni animaciones que compitan con la lectura. `prefers-reduced-motion` desactiva todo y deja el gráfico ya dibujado.

## 6. Stack del frontend

| Herramienta | Rol | Nota |
|---|---|---|
| Vite + React 19 + TS | base | — |
| Astryx (`@astryxdesign/core`, sin `theme-neutral`) | primitivos de `components/ui` | puente de tokens en `tokens.css`; versión exacta |
| Tailwind CSS 4 | layout fino | cascade layers |
| **react-icons** | iconografía única | `lu` |
| react-hook-form + zod | formularios espejo de DTO | `zodResolver` |
| TanStack Query v5 | estado del servidor | queryKeys `['clients', page, size, search]`… |
| Zustand v5 | sesión (`persist`) + tema | dark-first |
| react-router v7 | rutas + guards por rol | library mode |

## 7. Arquitectura y convenciones de código

- **Organización por entidad/dominio**: cada feature vive en `src/features/<entidad>/`. Todo lo específico de esa entidad —componentes, layouts, páginas, queries/hooks, formularios, esquemas, tipos y lógica de acceso a datos— permanece dentro de esa carpeta. Por ejemplo, todo lo de usuarios va en `src/features/users/`.
- Estructura interna: `components/`, `hooks/`, `api/`, `model/` y, cuando aplique, `layouts/` o `pages/`. Crear solo las capas que la entidad necesite.
- Lo reutilizable entre entidades vive en `src/components/ui/` o en módulos compartidos de `src/lib/`; no se duplica ni se coloca en una entidad arbitraria. El shell y la navegación global pertenecen a `src/components/layout/`.
- **Nombres descriptivos**: variables, funciones, hooks, componentes, archivos y carpetas en inglés y `camelCase` (`userQuery`, `loadUserProfile`, `useUserDetails`, `userProfile`). Los componentes React también se declaran/exportan en `camelCase`; para renderizarlos, agruparlos en un namespace descriptivo y usar JSX namespaced (por ejemplo, `<userComponents.userProfile />`). Los tipos conservan `PascalCase` (`UserProfileProps`). Evitar nombres genéricos como `Item`, `Data` o `Component`.
- **Tailwind y CSS propio**: usar Tailwind para layout, espaciado, tipografía, color, responsive y estados. Reservar CSS propio para necesidades que no se expresen con utilidades (por ejemplo, keyframes específicos) y nombrar sus clases con BEM y segmentos `camelCase`: `block`, `block__element`, `block__element--modifier` (por ejemplo, `userCard`, `userCard__userName`, `userCard__userName--muted`). Mantener cada bloque ligado a su componente o entidad y evitar nombres globales ambiguos.
- **Arrow functions**: todo componente React, hook y función auxiliar se declara como `const` con arrow function (`const userProfile = (...) => {}`). Prohibidas las declaraciones `function`, incluidas las expresiones que recibe `memo`.
- **Componentes y lógica separados**: dentro de cada feature, `components/` solo contiene JSX y estado de UI local; `hooks/` concentra estado, efectos, formularios y navegación; `api/` las llamadas HTTP; `model/` esquemas, tipos y constantes. Un componente no ejecuta peticiones ni validaciones que pueda recibir de un hook.
- Mantener identificadores de código en inglés y respetar los contratos de API y las convenciones visuales de esta guía.

## 8. Mockup de referencia

`front/mockup/` (git-ignorado, **nunca se sube**): HTML+CSS nativo, cero JS.

- `index.html` — login centrado, formulario en panel, error 401 como toast.
- `dashboard.html` — franja de 3 métricas, línea de asistencia, agenda y últimos pagos.
- `clients.html` — directorio de 6 fichas mínimas (3 datos + 2 acciones).
- `client-create.html` — formulario en 2 columnas + membresía inicial + error 400 como toast.
- `client-detail.html` — panel de membresía, historial, pagos y datos.
- `client-renew.html` — modal de renovación con la regla `max(endDate, hoy)` y conflicto 409 como toast.

Técnica: tema con checkbox oculto + `body:has()`, sprite SVG inline en cada página, modales `<dialog open>` fijos, `prefers-reduced-motion` respetado.

Cambios visuales relevantes se registran aquí como decisiones, no en comentarios de código.
