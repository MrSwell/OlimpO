# FRONTEND_BASE.md — Bases y directivas de estilo del frontend Olimpo

Fuente de verdad visual para `front/`. Cualquier cambio de identidad se documenta aquí primero y luego se replica en código. Última actualización: 2026-11-12 (mockup v4 — negro editorial).

---

## 0. Directivas de estilo (obligatorias)

Estas reglas mandan sobre cualquier preferencia estética y se aplican a todo el frontend, mockups incluidos:

1. **El fondo siempre es negro.** Las superficies son negro cálido (`--bg`, `--panel`, `--panel-2`). Nunca se rellena un contenedor con un color de estado (rojo, verde, ámbar, dorado translúcido) ni con un tinte de marca.
2. **Solo bordes.** La separación se comunica con un borde de 1px neutro (`--line` / `--line-strong`). El color no pinta el borde de un contenedor; el dorado solo aparece en foco, en la acción principal y en texto de acento.
3. **Los errores siempre son pops.** Un error se comunica con un **toast** flotante (superficie negra, borde neutro, icono de color, título + recuperación). Prohibidos los banners inline, los bloques con fondo de color y los bordes de color para errores.
4. **La información no satura.** Máximo **3 bloques** por vista. Las métricas se leen como texto, no como cards con iconos. Las tablas muestran lo esencial y el resto vive en el detalle.
5. **Cero gradientes.** Ni en fondos, ni en botones, ni en texto, ni en tarjetas. La jerarquía se logra con tipografía, borde y espacio.
6. **Cero chips rellenos.** El estado se muestra con un **punto de 6px + texto**; una etiqueta es solo borde de 1px sin fondo.
7. **Sin sombras en cards.** La elevación se declara una vez con el borde. La sombra queda reservada a capas flotantes (toast y modal).
8. **Navegación por texto.** Barra superior con enlaces; sin sidebar, sin iconos decorativos en la navegación. Solo se dibujan iconos funcionales (buscar, tema, cerrar, alerta).
9. **Acento dorado con disciplina.** Dorado únicamente en: marca, enlace activo, borde/texto de la acción principal, foco y cifras clave. Nunca como relleno.
10. **Densidad y aire.** Padding de página 56/32, separación entre bloques 24–32, paneles con 24 de padding. Más espacio sobre un título que debajo.

> Cualquier propuesta que necesite relleno de color para explicarse está mal resuelta: se resuelve con borde, texto o espacio.

## 1. Identidad visual — "Negro editorial"

Dirección: un sistema de gestión que se lee como una publicación, no como un tablero de videojuego. Negro cálido, líneas finas, tipografía con jerarquía y un único ornamento griego.

- **Dark-first**: la app abre en oscuro. El tema claro existe con la misma estructura y reglas (papel cálido, sin rellenos tintados).
- **Motivo griego único**: el **meandro**, dibujado como línea dorada de 1px al 55% de opacidad. Aparece solo en el pie, el login y el panel de membresía. Nada más.
- **Glifo de columna dórica** como marca (SVG propio; en React, `react-icons`/componente de marca).
- **Regla de tokens**: hex crudo prohibido fuera de `olimpoTheme.ts` (React) y de `styles.css :root` (mockup). En dark no se duplica con `dark:` — cambian los tokens.
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

## 3. Iconografía — react-icons

- Librería: **`react-icons`** (`lu` para UI, `io5` para glifos decorativos si hiciera falta).
- En la interfaz solo iconos funcionales: buscar, tema, cerrar, alerta. La navegación es texto.
- Trazo uniforme 1.7, tamaños 16–18px.

## 4. Vocabulario de componentes (mockup v4)

| Componente | Patrón | Dónde se usa |
|---|---|---|
| `Metric` | label uppercase + cifra serif + delta en texto; sin card ni icono | Franja de resumen del panel |
| `Panel` | superficie `--panel` + borde 1px + radio 12 + padding 24 | contenedor base |
| `PanelHead` | título 15px + acción de texto, separados por hairline | cabecera de panel |
| `Row` | hora / contenido / valor, filas con hairline | agenda, vencimientos |
| `Table` | header sin fondo, filas hairline, columnas alineadas | pagos, historial |
| `Status` | punto de 6px + texto; color solo en el punto | membresía, cuenta |
| `Tag` | borde 1px, sin relleno | etiquetas puntuales |
| `Toast` | único canal de error: negro + borde + icono + título + recuperación | login, formularios, acciones |
| `Modal` | `<dialog open>` + scrim, superficie negra | renovación |
| `ClientCard` | avatar + nombre + correo + 3 datos + 2 acciones de texto | directorio de clientes |
| `MembershipPanel` | plan en serif + fechas + meandro | ficha del cliente |
| `Chart` | línea dorada sobre grid hairline | asistencia |
| `Button` | outline; principal = borde y texto dorados; nunca relleno | acciones |
| `Input` | `--panel-2` + borde neutro; foco dorado | formularios |

## 5. Layout

- **Header** 68px sticky: marca, navegación de texto, toggle de tema, usuario. En `<820px` la navegación se oculta.
- **Página**: máx 1180px, padding 56/32, bloques separados por 24–32px.
- **Panel**: franja de métricas (3) → split 1.9fr/1fr → panel de tabla. Nada más.
- **Footer**: meandro + firma.
- Responsive: 1180 / 1020 / 820 / 560.

## 6. Stack del frontend

| Herramienta | Rol | Nota |
|---|---|---|
| Vite + React 19 + TS | base | — |
| Astryx (`@astryxdesign/core` + theme-neutral) | componentes base a adaptar | pin de versión exacta (beta) |
| Tailwind CSS 4 | layout fino | cascade layers |
| **react-icons** | iconografía única | `lu` (+`io5`) |
| react-hook-form + zod | formularios espejo de DTO | `zodResolver` |
| TanStack Query v5 | estado del servidor | queryKeys `['clients', page, size, search]`… |
| Zustand v5 | sesión (`persist`) + tema | dark-first |
| react-router v7 | rutas + guards por rol | library mode |

## 7. Mockup de referencia

`front/mockup/` (git-ignorado, **nunca se sube**): HTML+CSS nativo, cero JS.

- `index.html` — login centrado, formulario en panel, error 401 como toast.
- `dashboard.html` — franja de 3 métricas, línea de asistencia, agenda y últimos pagos.
- `clients.html` — directorio de 6 fichas mínimas (3 datos + 2 acciones).
- `client-create.html` — formulario en 2 columnas + membresía inicial + error 400 como toast.
- `client-detail.html` — panel de membresía, historial, pagos y datos.
- `client-renew.html` — modal de renovación con la regla `max(endDate, hoy)` y conflicto 409 como toast.

Técnica: tema con checkbox oculto + `body:has()`, modales `<dialog open>` fijos, `prefers-reduced-motion` respetado.

Cambios visuales relevantes se registran aquí como decisiones, no en comentarios de código.
