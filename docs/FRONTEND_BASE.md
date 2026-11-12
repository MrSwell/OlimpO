# FRONTEND_BASE.md — Bases del frontend Olimpo (design system + stack)

Fuente de verdad visual para `front/`. Cualquier cambio de identidad se documenta aquí primero y luego se replica en código. Última actualización: 2026-11-12 (mockup v2).

---

## 1. Identidad visual — "Olimpo nocturno"

**Dark-first**: la app abre en modo oscuro; el modo claro existe y es de igual calidad (toggle en el topbar, preferencia persistida en el futuro `useUiStore`, default = oscuro).

Metodología olímpica/griega + minimalismo premium:

- **Paleta**: dorado olímpico + azules zafiro + negro zafiro (nada de grises planos: los negros y superficies tienen base azulada).
- **Motivo griego único**: el **meandro** (clave griega) como divisor decorativo en oro — bajo la marca, en la tarjeta de membresía y en el pie del sidebar. Es el único ornamento; el resto es geometría limpia.
- **Glifo de columna dórica** como logo (en React se renderiza con `react-icons`).
- **Regla de oro de color**: hex crudo prohibido fuera del archivo de tokens (`olimpoTheme.ts` en React; `styles.css :root` en el mockup). En dark mode no se duplica con `dark:` — cambian los tokens.

### Tokens (dark = default)

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--bg` | `#0A0D18` | `#F4F5F9` | fondo app |
| `--surface` | `#121726` | `#FFFFFF` | cards, sidebar, topbar |
| `--surface-2` | `#171E30` | `#F8F9FC` | headers de card, hover |
| `--surface-3` | `#1C2438` | `#EDEFF6` | pistas de charts, huecos |
| `--text` | `#E8EAF2` | `#12182B` | contenido |
| `--text-muted` | `#8B92A8` | `#5A6272` | secundario |
| `--sapphire` | `#4D7CFF` | `#2B55D4` | acción primaria, links, foco |
| `--sapphire-strong` | `#6E96FF` | `#1F3FA8` | hover primario |
| `--gold` | `#E8B93E` | `#A87D14` | identidad, acento activo, ADMIN |
| `--gold-strong` | `#F5CE5C` | `#C9A227` | meandro, avatares oro |
| `--success / --warning / --danger` | `#43D9A3` / `#F0B24A` / `#FF6B6B` | equivalentes AA | estados de negocio |

- **Gradientes firma**:
  - `grad-sapphire`: `linear-gradient(135deg, #24408F, #101B3E)` — stat destacado, tarjeta de membresía, panel de login.
  - `grad-gold`: `linear-gradient(135deg, #F5CE5C, #B98A1B)` — CTA dorado, card de upgrade.
  - `grad-surface`: brillo interno `inset 0 1px 0 rgba(255,255,255,.04)` en toda card (sensación de vidrio pulido).
- **Profundidad**: sombras largas y suaves en dark (`0 10px 30px rgba(0,0,0,.35)`); hairline borders `#1F2740`.

### Estados de negocio (chips)

- Membresía: `ACTIVE`→success · `EXPIRED`→muted · por vencer→warning · **tipos (DAILY/QUARTERLY/MONTHLY)→gold** · sin membresía→danger.
- Pagos: `CASH`→success · `CARD`→sapphire · `TRANSFER`→neutral · `NEQUI`→gold.
- Roles: `ADMIN`→gold · `RECEPCIONIST`→sapphire · `TRAINER_MANAGER`→sapphire-strong · `TRAINER`→success · `CLIENT`→neutral.
- Cuenta: `ACTIVE`→success · `INACTIVE/DEACTIVATED`→danger.

---

## 2. Tipografía y forma

- **Marca y cifras grandes**: serif (Palatino/Georgia en mockup; en React, la pila del tema Astryx con `Heading`). Cifras siempre `tabular-nums`.
- **Cuerpo y datos**: sans del sistema (Inter cuando llegue Astryx).
- Radios: sm 8 · md 12/14 · lg 16. Densidad media. Escala de espaciado 4px.
- Focus visible **siempre**: anillo `0 0 0 3px` sapphire-soft + borde sapphire; en elementos dorados, anillo dorado.

## 3. Iconografía — react-icons

- Librería: **`react-icons`** (agregada al stack; reemplaza a lucide-react como fuente única de iconos).
- Set base: `react-icons/lu` (Lucide) para UI general; `react-icons/io5` para glifos griegos/decorativos si hace falta.
- Iconos decorativos de marca (columna, laurel, meandro): SVG inline propios en el mockup; en React viven en `components/brand/`.
- Tamaño estándar 18px nav / 15px botones / 30px empty-states; `stroke-width` 1.7 uniforme.

## 4. Vocabulario de componentes (probado en el mockup v2)

Estos patrones ya existen en HTML+CSS nativo (`front/mockup/`) y se traducirán 1:1 a Astryx+Tailwind:

| Componente | Patrón visual | Dónde se usa |
|---|---|---|
| `StatCard` | valor serif grande, label uppercase, flecha-chip circular arriba a la derecha | Dashboard (fila de 4) |
| `StatCard featured` | variante con `grad-sapphire`, texto blanco, flecha-chip dorada | 1ª KPI de la fila |
| `Sparkline` | SVG polyline sapphire con punto final dorado | KPI de ingresos |
| `WeeklyBars` | 7 columnas día; barras sólidas (gradiente) vs rayadas (`repeating-linear-gradient` 45°) = sin datos/pendiente; tooltip flotante con % | Actividad semanal |
| `DonutGauge` | `conic-gradient` + hueco central (capa interna del color de la superficie) + % al centro | Retención / ocupación |
| `MiniBars` | 6 barras finas redondeadas (ingresos por mes) | Card ingresos |
| `PaymentRow` | avatar + nombre + meta + chip método + monto `tabular-nums` | Últimos pagos |
| `ReminderCard` | título serif, hora, botón de acción | Agenda del día |
| `ClientCard` | avatar-gradiente + nombre + doc + chips de membresía + medidor de días restantes + contacto + objetivo + acciones | Módulo Clientes (grid, no tabla plana) |
| `MeterBar` | pista `surface-3` + relleno gradiente (sapphire→gold cuando queda < 7 días) | días restantes de membresía |
| `Avatar` | iniciales sobre gradiente; variantes `av-gold`, `av-sapphire`, `av-violet`, `av-jade` | todos los módulos |
| `MembershipCard` | tarjeta tipo **credit card**: `grad-sapphire`, chip dorado, meandro al agua, tipo + fechas, N° interno enmascarado | ficha del cliente |
| `PillFilter` | chips-filtro con estado activo (borde dorado) | toolbars de listas |
| `Modal` | `<dialog>` centrado **fixed** + scrim propio con blur (no depende del flujo del documento) | crear cliente, renovar |
| `ErrorBanner` | borde + fondo danger-soft, muestra `{status, error, message}` del backend tal cual | formularios |
| `UpgradeCard` (sidebar) | mini card `grad-gold` con CTA | pie del sidebar |

## 5. Layout del shell

- **Sidebar** 244px: secciones ("Recepción" / "Gestión"), item activo con **barra dorada izquierda** + fondo gold-soft; items bloqueados con chip de motivo (`ADMIN`, `Staff dep.`, `Fase 2`) — refleja la matriz de acceso del backend. En `<860px` colapsa a 68px (solo iconos).
- **Topbar** 56px sticky: breadcrumb, buscador con atajo `⌘K`, theme toggle integrado (no flotante), avatar + rol.
- **Contenido** máx 1200px, padding 24. Grillas del dashboard: fila KPI (4) → zona principal 1.6fr/1fr.
- Responsive verificado: 1280 / 1024 / 860 / 375.

## 6. Stack del frontend (actualizado)

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

- `index.html` — login split-screen (panel zafiro + formulario).
- `dashboard.html` — shell completo + KPIs, barras semanales, donut, recordatorios, últimos pagos.
- `clients.html` — **grid de ClientCards** (no tabla) + filtros pill.
- `client-create.html` — modal de registro sobre la grid (scrim + blur).
- `client-detail.html` — ficha con MembershipCard tipo credit card + pagos + historial.
- `client-renew.html` — modal de renovación con preview de la regla `max(endDate, hoy)`.

Cambios visuales relevantes se registran aquí como decisiones, no en comentarios de código.
