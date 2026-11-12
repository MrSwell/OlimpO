# FRONTEND_BASE.md — Bases del frontend Olimpo (design system + stack)

Fuente de verdad visual para `front/`. Cualquier cambio de identidad se documenta aquí primero y luego se replica en código. Última actualización: 2026-11-12 (mockup v3 — oro + negro cálido).

---

## 0. Decisiones de identidad

- **Sin azules (2026-11-12)**: se elimina el zafiro de la identidad. Ningún tono azul se usa como marca, estado, foco ni decoración. La paleta es **dorado + negro cálido**.
- **Cobre = secundario funcional**: solo para diferenciar estados (pago con tarjeta, RECEPCIONIST, barras de comparación, tramo secundario del donut). Nunca como decoración ni como color de marca.
- **Oscuro primero**: la app abre en dark; el tema claro es de igual calidad y se alterna desde el topbar.
- **Hex crudo prohibido** fuera del archivo de tokens (`olimpoTheme.ts` en React; `styles.css :root` en el mockup). En dark mode no se duplica con `dark:` — cambian los tokens.

## 1. Identidad visual — "Olimpo: oro sobre negro cálido"

Metodología olímpica/griega + minimalismo premium. El negro es **cálido** (subtono marrón), nunca gris plano ni azulado; el papel del tema claro es cálido, no blanco frío.

- **Motivo griego único**: el **meandro** (clave griega) como divisor decorativo en oro — bajo la marca, en la tarjeta de membresía y en el pie del sidebar. Es el único ornamento; el resto es geometría limpia.
- **Glifo de columna dórica** como logo (en React se renderiza con `react-icons` / SVG de marca).
- **Gradientes firma**:
  - `--grad-gold`: `linear-gradient(135deg, #f5ce5c, #b98a1b)` — CTA primario, stat destacado, chip de la tarjeta.
  - `--grad-black`: `linear-gradient(135deg, #1c1710, #0e0b07 78%)` — tarjeta de membresía, panel del login, promo del sidebar.
  - `--grad-bar`: cobre (comparativo) · `--grad-bar-gold`: oro (dato actual).
- **Profundidad declarada una sola vez**: las cards se definen con **borde + hairline interior** (`inset 0 1px 0`), sin sombra difusa; la sombra (`--shadow-pop`) queda reservada a capas flotantes (modales, botones sobre superficies negras). Sin halos de color a offset cero.

### Tokens (dark = default)

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--bg` | `#0c0a07` | `#f6f3ec` | fondo app (negro cálido / papel cálido) |
| `--surface` | `#14110c` | `#ffffff` | cards, sidebar, topbar |
| `--surface-2` | `#1a1610` | `#f9f6ef` | headers de card, hover, inputs |
| `--surface-3` | `#221d14` | `#efe9dc` | pistas de charts, huecos |
| `--text` | `#f0ebe1` | `#1a140c` | contenido |
| `--text-muted` | `#a79e8d` | `#6b6252` | secundario |
| `--text-faint` | `#6e675a` | `#988f7d` | terciario, labels |
| `--border` | `#292319` | `#e7e1d3` | borde de card |
| `--border-strong` | `#3a3224` | `#d8d0bd` | inputs, chips, divisores fuertes |
| `--gold` | `#e8b93e` | `#8a6d1f` | identidad, acento activo, ADMIN |
| `--gold-strong` | `#f5ce5c` | `#9a7514` | hover, texto de marca, meandro |
| `--gold-deep` | `#b98a1b` | `#6e5613` | fin de gradiente, scrollbar hover |
| `--copper` | `#d08b4c` | `#a56432` | secundario funcional (CARD, RECEPCIONIST) |
| `--copper-strong` | `#e0a468` | `#8a5a28` | texto/acento cobre |
| `--success` | `#5fbf77` | `#1e7f4f` | estados positivos |
| `--warning` | `#e0a468` | `#a35d00` | por vencer |
| `--danger` | `#e06555` | `#b3261e` | errores, vencida |

- **Superficies del navegador también se tematizan**: `::selection` dorada translúcida, `caret-color` oro, scrollbars finos en `--border-strong` (hover oro). En light se ajustan a la versión oscura del oro.

### Estados de negocio (chips)

- Membresía: `ACTIVE`→success · `EXPIRED`→neutral/muted · por vencer→warning · **tipos (DAILY/QUARTERLY/MONTHLY)→gold** · sin membresía→danger.
- Pagos: `CASH`→success · `CARD`→**copper** · `TRANSFER`→neutral · `NEQUI`→gold.
- Roles: `ADMIN`→gold · `RECEPCIONIST`→copper · `TRAINER_MANAGER`→jade (avatar) · `TRAINER`→success · `CLIENT`→neutral.
- Cuenta: `ACTIVE`→success · `INACTIVE/DEACTIVATED`→danger.
- Avatares (solo identificación, nunca estado): `gold` (default), `copper`, `jade`, `rose`. Sin zafiro ni violeta.

---

## 2. Tipografía y forma

- **Marca y cifras grandes**: serif (Palatino/Georgia en mockup; en React, la pila del tema Astryx con `Heading`). Cifras siempre `tabular-nums`.
- **Cuerpo y datos**: sans del sistema (Inter cuando llegue Astryx).
- Radios: sm 8 · md 12 · lg 16. Densidad media. Escala de espaciado 4px.
- **Espaciado**: grupos apretados, separación generosa, más aire sobre un título que debajo.
- Focus visible **siempre**: anillo `0 0 0 3px` gold-soft + borde oro; en superficies doradas, anillo oscuro `rgb(20 16 8 / 0.55)`.
- Texto de cuerpo con medida 65–75ch; `text-wrap: balance` en títulos.

## 3. Iconografía — react-icons

- Librería: **`react-icons`** (fuente única de iconos; reemplaza a lucide-react).
- Set base: `react-icons/lu` (Lucide) para UI general; `react-icons/io5` para glifos griegos/decorativos si hace falta.
- Iconos decorativos de marca (columna, laurel, meandro): SVG inline propios en el mockup; en React viven en `components/brand/`.
- Tamaño estándar 18px nav / 15px botones / 30px empty-states; `stroke-width` 1.7 uniforme.

## 4. Vocabulario de componentes (probado en el mockup v3)

Estos patrones existen en HTML+CSS nativo (`front/mockup/`) y se traducen 1:1 a Astryx+Tailwind:

| Componente | Patrón visual | Dónde se usa |
|---|---|---|
| `StatCard` | valor serif grande, label uppercase, icon-chip circular arriba a la derecha | Dashboard (fila de 4) |
| `StatCard featured` | variante `grad-gold`, **texto oscuro** `#141008`, icon-chip oscuro, sparkline oscura | 1ª KPI de la fila |
| `Sparkline` | SVG polyline oscura sobre card dorada, punto final sólido | KPI de clientes |
| `WeeklyBars` | 7 columnas día; barras cobre (gradiente) vs **rayadas 45°** = sin datos/pendiente; barra "hoy" en oro con tooltip flotante | Asistencia semanal |
| `DonutGauge` | `conic-gradient` oro + cobre + surface-3, hueco central del color de la superficie, total al centro | Composición de membresías |
| `MiniBars` | 6 barras finas redondeadas (ingresos por mes), última en oro pleno | Card ingresos |
| `PaymentRow` | avatar + nombre + meta + chip método + monto `tabular-nums` | Últimos pagos / pagos del cliente |
| `ReminderCard` | chip de contexto, título serif, hora, botón de acción | Agenda del día / seguimiento |
| `ClientCard` | avatar-gradiente + nombre + correo + chips de membresía + teléfono/ingreso/ciudad + medidor de días + acciones | Módulo Clientes (grid, no tabla plana) |
| `MeterBar` | pista `surface-3` + relleno `grad-bar-gold`; `--warn` cobre; `--danger` warning→danger | días restantes de membresía |
| `Avatar` | iniciales sobre gradiente; variantes `gold`, `copper`, `jade`, `rose` | todos los módulos |
| `MembershipCard` | tarjeta tipo **credit card** negro-oro: `grad-black`, borde oro, chip dorado, meandro al agua, tipo + fechas + días | ficha del cliente |
| `PillFilter` | chips-filtro con estado activo (borde oro + gold-soft) | toolbars de listas |
| `Modal` | `<dialog>` centrado **fixed** + scrim propio con blur | renovar membresía |
| `ErrorBanner` | borde + fondo danger-soft, muestra `{status, error, message}` del backend tal cual | formularios |
| `UpgradeCard` (sidebar) | mini card `grad-black` con texto oro y CTA `btn-dark` | pie del sidebar |

## 5. Layout del shell

- **Sidebar** 244px: secciones ("Gestión" / "Operación"), item activo con **fondo gold-soft + anillo interior oro** (sin barra lateral de color); items bloqueados con chip de motivo (`ADMIN`, `PRÓX.`) — refleja la matriz de acceso del backend. En `<860px` colapsa a 68px (solo iconos).
- **Topbar** 58px sticky: breadcrumb, buscador con atajo `⌘K`, theme toggle integrado (no flotante), notificaciones, avatar + rol.
- **Contenido** máx 1240px, padding 24. Grillas del dashboard: fila KPI (4) → zona principal 1.65fr/1fr.
- Responsive verificado: 1280 / 1024 / 860 / 560 / 375.

## 6. Stack del frontend

| Herramienta | Rol | Nota |
|---|---|---|
| Vite + React 19 + TS | base | — |
| Astryx (`@astryxdesign/core` + theme-neutral) | componentes base a adaptar | pin de versión exacta (beta) |
| Tailwind CSS 4 | layout fino | cascade layers, utilidades ganan |
| **react-icons** | iconografía única | set `lu` (+`io5` decorativos) |
| react-hook-form + zod | formularios espejo de DTO | `zodResolver` |
| TanStack Query v5 | estado del servidor | queryKeys `['clients', page, size, search]`… |
| Zustand v5 | sesión (`persist`) + preferencia de tema | dark-first |
| react-router v7 | rutas + guards por rol | library mode |

## 7. Mockup de referencia

`front/mockup/` (git-ignorado, **nunca se sube**): HTML+CSS nativo, cero JS.

- `index.html` — login split-screen (panel negro cálido con aurora dorada + panel de formulario).
- `dashboard.html` — shell completo + KPIs (1 destacado en oro), barras semanales, donut, recordatorio, últimos pagos, mini-barras.
- `clients.html` — **grid de ClientCards** (no tabla) con datos completos por cliente + filtros pill.
- `client-create.html` — página de registro en 2 columnas + membresía inicial opcional + nota de regla 409.
- `client-detail.html` — ficha con MembershipCard negro-oro + historial + pagos + datos personales.
- `client-renew.html` — detalle + modal de renovación con preview de la regla `max(endDate, hoy)` y ejemplo 409.

Técnica del mockup: tema con checkbox oculto + `body:has()` (dark por defecto), modales con `<dialog open>` fijo + `.scrim` con blur, `prefers-reduced-motion` respetado.

Cambios visuales relevantes se registran aquí como decisiones, no en comentarios de código.
