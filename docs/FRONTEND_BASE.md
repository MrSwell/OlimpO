# FRONTEND_BASE.md — Bases y directivas de estilo del frontend Olimpo

Fuente de verdad visual para `front/`. Cualquier cambio de identidad se documenta aquí primero y luego se replica en código. Última actualización: 2026-11-12 (mockup v4 — negro editorial + iconos y movimiento).

---

## 0. Directivas de estilo (obligatorias)

Estas reglas mandan sobre cualquier preferencia estética y se aplican a todo el frontend, mockups incluidos:

1. **El fondo siempre es negro.** Las superficies son negro cálido (`--bg`, `--panel`, `--panel-2`). Nunca se rellena un contenedor con un color de estado (rojo, verde, ámbar, dorado translúcido) ni con un tinte de marca.
2. **Solo bordes.** La separación se comunica con un borde de 1px neutro (`--line` / `--line-strong`). El color no pinta el borde de un contenedor; el dorado solo aparece en foco, en la acción principal y en texto de acento.
3. **Errores de campo junto al campo; errores globales como pops.** La validación local y los errores de campo reconocidos del backend usan un mensaje pequeño bajo el input, texto e icono rojos y borde rojo en el campo; se limpian al editarlo. Errores de negocio, sesión, red y servidor sin campo asociado usan un **toast** flotante (superficie negra, borde neutro, icono de color, título + recuperación). No usar banners ni fondos rojos. Si el backend rechaza credenciales sin identificar cuál, se muestra el toast y se marcan correo y contraseña.
4. **La información no satura.** Máximo **3 bloques principales (regiones)** por vista. Los detalles se agrupan en subsecciones con hairline dentro de un bloque, no en cards adicionales. Las métricas se leen como texto, no como cards con iconos. Las tablas muestran lo esencial y el resto vive en el detalle.
5. **Cero gradientes.** Ni en fondos, ni en botones, ni en texto, ni en tarjetas. La jerarquía se logra con tipografía, borde y espacio.
6. **Cero chips rellenos.** El estado se muestra con un **punto de 6px + texto**; una etiqueta es solo borde de 1px sin fondo.
7. **Sin sombras en cards.** La elevación se declara una vez con el borde. La sombra queda reservada a capas flotantes (toast y modal).
8. **Navegación por rol dentro del menú de usuario.** El encabezado autenticado conserva la marca y un único control de usuario; sus acciones se agrupan por los roles de esa cuenta y cada enlace muestra su icono funcional. Tema, diseño de desarrollo y cierre de sesión también viven ahí. Nunca ilustraciones decorativas ni iconos rellenos.
9. **Acento dorado con disciplina.** Dorado únicamente en: marca, icono del enlace activo, icono de sección al pasar el cursor, borde/texto de la acción principal, foco y cifras clave. Nunca como relleno.
10. **Densidad y aire.** Padding de página 56/32, separación entre bloques 24–32, paneles con 24 de padding. Más espacio sobre un título que debajo.

> Cualquier propuesta que necesite relleno de color para explicarse está mal resuelta: se resuelve con borde, texto o espacio.

## 1. Identidad visual — "Negro editorial"

Dirección: un sistema de gestión que se lee como una publicación, no como un tablero de videojuego. Negro cálido, líneas finas, tipografía con jerarquía y un único ornamento griego.

- **Carácter olímpico de Olimpo**: la referencia helénica debe reconocerse en proporciones arquitectónicas, el glifo de columna dórica, el meandro y la serif editorial; reforzarla en superficies públicas sin convertir cada bloque en un templo ni recurrir a adornos genéricos de gimnasio.
- **Dark-first**: la app abre en oscuro. El tema claro existe con la misma estructura y reglas (papel cálido, sin rellenos tintados).
- **Motivo griego único**: el **meandro**, dibujado como línea dorada de 1px al 55% de opacidad. Aparece solo en el pie, el login y el panel de membresía. Nada más.
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
| `--danger` | `#e08272` | `#a53c30` | icono de error |
| `--success` | `#86c79a` | `#2c6b45` | punto de estado activo |
| `--warning` | `#d9a86a` | `#8a5a12` | punto por vencer |

- **Superficies del navegador tematizadas**: selección dorada translúcida, `caret-color` dorado, scrollbars finos en `--line-strong` con hover dorado, `underline-offset` en enlaces y cifras `tabular-nums` en datos.
- **Foco**: anillo de 2px `--gold-strong` con offset 2. Siempre visible.

## 2. Tipografía y forma

- **UI**: sans del sistema; títulos 600 con tracking `-0.02em`.
- **Cifras y nombres de plan**: serif (Palatino/Georgia) en peso 400, tamaño grande. Aporta el tono editorial sin decorar.
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

- **Header** 68px sticky: marca y un menú de usuario compacto. Las acciones se agrupan por el conjunto de roles que permite cada ruta; preferencias y cierre de sesión están al pie del mismo menú. Las páginas públicas (`/`, `/login` y el 404 sin sesión) comparten el header de la home.
- **Página**: máx 1180px, padding 56/32, bloques separados por 24–32px.
- **panel**: franja de métricas (3) → split 1.9fr/1fr → panel de tabla. Nada más.
- **Login**: una sola tarjeta alineada a la izquierda con dos pasos, rol y credenciales. El selector de rol es compacto y el rol elegido ajusta el título, el resumen y las pistas del formulario.
- **Footer**: meandro + firma.
- Responsive: 1180 / 1020 / 820 / 560.

### Movimiento (vida sin ruido)

- **Entrada de página**: los bloques suben 10px y aparecen en 0.5s con un stagger de 50ms. Solo una vez, al cargar.
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
