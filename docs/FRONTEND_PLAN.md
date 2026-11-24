# FRONTEND_PLAN.md — Plan de implementación del frontend Olimpo

Estado: F1–F5 implementadas; F4.5 consolida el estilo V1.0.0 · Última actualización: 2026-11-18
Alcance: `front/` (React SPA) consumiendo `/api/v1` **sin modificar el contrato**.

Fuentes de verdad:

- `docs/FRONTEND_BASE.md` — identidad, tokens, componentes y movimiento (fuente visual canónica).
- `docs/ARCHITECTURE.md` — rutas, roles, errores y reglas de negocio.
- `docs/AGENTS.md` — convenciones del repositorio.

---

## 0. Contrato visual vinculante

Estas reglas son criterio de aceptación, no inspiración. Se aplican a cada pantalla, estado y breakpoint.

1. **El fondo es oscuro.** Superficies negro cálido (`--bg`, `--panel`, `--panel-2`); color semántico y dorado se reservan para acciones, estados y acentos pequeños.
2. **Separación por borde.** La estructura usa bordes neutros de 1px; las acciones conservan sus variantes establecidas en `FRONTEND_BASE.md`.
3. **Errores de campo junto al campo; errores globales como pops.** Validaciones locales y errores del backend asociados a un campo usan `fieldError`, texto e icono rojos y borde rojo en el input, sin fondo tintado; desaparecen al editar el campo. Errores globales, de sesión, red y negocio usan toast. Si el backend rechaza credenciales sin especificar cuál, se muestra toast y se marcan ambos campos.
4. **La información no satura.** Máximo **3 bloques principales (regiones)** por vista. Los detalles se agrupan en subsecciones con hairline dentro de un bloque, no en cards adicionales. Las métricas se leen como texto, no como cards. Las tablas muestran lo esencial; el resto vive en el detalle.
5. **Identidad consistente.** Los acentos no cambian los contratos ni la lectura: las tarjetas de inventario usan tintes oscuros y sutiles; clientes y máquinas conservan superficies oscuras y contraste.
6. **Cero chips rellenos.** El estado es un **punto de 6px + texto**; una etiqueta es solo borde de 1px sin fondo.
7. **Sin sombras en cards.** La elevación se declara con el borde. La sombra queda solo para capas flotantes (toast y modal).
8. **Navegación por texto con icono funcional.** Barra superior, sin sidebar. Cada enlace lleva un icono de línea que lo representa; nunca ilustraciones ni iconos rellenos.
9. **Dorado con disciplina.** Se usa en marca, foco, acciones y cifras clave, con la intensidad definida por los tokens y variantes de botones.
10. **Densidad y aire.** Página 56/32, bloques separados 24–32 y filtros compactos; los directorios se adaptan al viewport y no ocultan datos en móvil.
11. **Iconografía de línea.** Sprite SVG en mockup; `react-icons/lu` en React. Trazo 1.7, tamaños 12–22px, color heredado. Siempre acompañan a texto.
12. **Movimiento silencioso.** La navegación usa View Transitions breves para páginas y elementos compartidos. Se respeta `prefers-reduced-motion`; la UI funciona sin animaciones.

> Si una pantalla necesita un relleno de color para explicarse, está mal resuelta: se corrige con borde, texto o espacio.

### 0.1 Tokens

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--bg` | `#080807` | `#f2f2f0` | fondo de la app |
| `--panel` | `#0d0d0b` | `#fafaf8` | paneles, toast, modal |
| `--panel-2` | `#111110` | `#f5f5f3` | inputs y selects |
| `--text` | `#ece9e2` | `#17150f` | contenido |
| `--text-muted` | `#a09c92` | `#5c584f` | secundario |
| `--text-faint` | `#8a867c` | `#6e6a60` | labels y metadatos |
| `--line` | `#262521` | `#dcdcd7` | bordes de paneles y filas |
| `--line-strong` | `#3a3833` | `#c8c8c1` | inputs, botones, toast |
| `--gold` | `#d9b45c` | `#7a5f16` | marca, acento, foco |
| `--gold-strong` | `#eccd82` | `#634d0d` | hover y texto de acento |
| `--danger` | `#e08272` | `#a53c30` | icono de error |
| `--success` | `#86c79a` | `#2c6b45` | punto activo |
| `--warning` | `#d9a86a` | `#8a5a12` | punto por vencer |

- Radios: paneles 12px, controles 8px. Sin pills.
- Tipografía: sans del sistema para UI; serif para cifras y nombre del plan.
- Hex crudo prohibido fuera de `src/styles/tokens.css` y del mockup.
- Dark-first; el tema claro cambia tokens, no duplica clases `dark:`.

### 0.2 Primitivos obligatorios

`panel`, `panelHead`, `metric`, `metricStrip`, `row`, `dataTable`, `status`, `tag`, `toast`, `fieldError`, `modal`, `button`, `iconButton`, `input`, `select`, `field`, `searchInput`, `pagination`, `emptyState`, `avatar`, `meander`, `icon`.

Los errores de validación local y los errores del backend asociados a un campo se presentan debajo del input con `fieldError` y borde rojo, y desaparecen al cambiar ese campo. Los errores globales y de negocio se presentan como toast. Si el backend no distingue qué credencial falló, se marca correo y contraseña y se conserva el toast.

Los primitivos adoptados de Astryx son `button`, `iconButton`, `modal`, `dataTable`, `tag`, `status` y `emptyState`; el resto sigue siendo propio. Las features no importan Astryx directamente: todo pasa por `components/ui`, que encapsula accesibilidad, tokens y variantes.

---

## 1. Stack y convenciones

| Herramienta | Rol |
|---|---|
| Vite + React 19 + TypeScript | base de la SPA |
| Astryx (`@astryxdesign/core`, sin `theme-neutral`) | primitivos de `components/ui` | puente de tokens en `tokens.css` |
| Tailwind CSS 4 | layout fino y utilidades; tokens en cascade layers |
| `react-icons/lu` | iconografía única |
| react-hook-form + zod | formularios espejo de los DTO |
| TanStack Query v5 | estado del servidor, caché y paginación |
| Zustand v5 | sesión (`persist`) y tema |
| react-router v7 | rutas, layouts y guards por rol |
| Vitest + Testing Library + MSW | pruebas de componentes y flujos |
| Playwright | E2E de login, cliente y renovación |

Convenciones:

- TypeScript `strict`; sin `any` en la capa de API.
- Identificadores, archivos, carpetas y componentes React en inglés y camelCase; tipos en PascalCase. Los componentes deben tener nombres descriptivos y se renderizan mediante namespaces JSX (por ejemplo, `<userComponents.userProfile />`).
- Tailwind para layout, espaciado, tipografía, color, responsive y estados. CSS propio solo para necesidades específicas; sus clases siguen BEM con segmentos camelCase (`block`, `block__element`, `block__element--modifier`).
- Organizar por entidad en `src/features/<entidad>/`: componentes, layouts, páginas, queries/hooks, esquemas y tipos específicos de cada dominio permanecen juntos. Todo lo de usuarios va en `src/features/users/`; lo compartido vive en `components/ui`, `components/layout` o `lib`.
- Sin secretos en el repositorio. La URL de API sale de `VITE_API_URL`.
- No se cambia el contrato `/api/v1`. Cualquier necesidad nueva se propone al perfil backend.
- Los mockups de `front/mockup/` son referencia local, git-ignored; no se copian a producción, se recrean con componentes.

---

- **Arrow functions**: todo componente React, hook y función auxiliar se declara como `const` con arrow function (`const panel = (...) => {}`). Prohibidas las declaraciones `function`, incluidas las expresiones que recibe `memo`.
- **Componentes y lógica separados**: cada feature agrupa por capa. `components/` solo contiene JSX y estado de UI local; `hooks/` concentra estado, efectos, formularios y navegación; `api/` las llamadas HTTP; `model/` esquemas, tipos y constantes. Un componente no ejecuta peticiones ni validaciones que pueda recibir de un hook.
- **Estructura de feature**: `src/features/<entidad>/components/`, `hooks/`, `api/` y `model/`. Se crean solo las capas que la entidad necesite; lo compartido vive en `components/ui`, `components/layout` o `lib`.

## 2. Estructura propuesta

```text
front/
├─ mockup/                     # referencia visual, nunca se sube
├─ index.html, vite.config.ts, package.json
└─ src/
   ├─ main.tsx
   ├─ app.tsx                  # rutas, guards en línea y toastHost
   ├─ app/
   │  ├─ providers.tsx         # ThemeProvider, QueryClientProvider
   │  └─ designPage.tsx        # /design, solo desarrollo
   ├─ components/
   │  ├─ layout/               # appShell, publicHeader, siteHeader, siteNav, siteFooter, pageHead, userMenu
   │  └─ ui/                   # primitivos del contrato visual (button, panel, modal, toastHost, fieldError…)
   ├─ features/
   │  ├─ home/                 # publicHomePage (home pública)
   │  ├─ auth/                 # loginPage (slider de rol→credenciales), protectedRoute, authSessionManager
   │  │   ├─ components/ · hooks/ (useLoginForm, useLoginRoleSlider, useShellSession)
   │  │   └─ api/ (authApi) · model/ (authTypes, loginFormSchema, loginRoleGuides, roleLabels)
   │  ├─ dashboard/            # dashboardPage y plannedFeaturePage (marcadores de fases futuras)
   │  ├─ clients/               # directorio, alta, ficha y renovación (F3, implementado)
   │  ├─ payments/              # registro e historial de pagos (F4, implementado)
   │  ├─ inventory/             # directorio, ficha y movimientos (F5, implementado)
   │  └─ machines/              # directorio con filtro de estado (F5, implementado)
   ├─ lib/                     # apiClient, queryClient, cn
   ├─ stores/                  # authStore, themeStore, toastStore
   └─ styles/                  # tokens.css, globals.css
```

> Las features de `schedules/` y `routines/` aún no existen; hoy sus enlaces llevan a `plannedFeaturePage`. `types/` vive dentro de cada feature (`model/`), no como carpeta raíz.

---

## 3. Rutas y permisos

Rutas **implementadas hoy**: `/`, `/#anclas`, `/login`, `/dashboard` (panel por rol con indicadores, paneles y atajos sobre endpoints reales), `/clients`, `/clients/new`, `/clients/:id` con renovación como **modal** dentro de la ficha, `/payments`, `/inventory`, `/inventory/:itemId`, `/machines`, `/schedules`, `/routines`, `/routines/:id` y `/design` (solo desarrollo, accesible desde el menú de usuario). El resto son rutas planificadas: hoy sus enlaces del shell llevan a `plannedFeaturePage`.

| Ruta | Vista | Roles | Estado |
|---|---|---|---|
| `/` | Home pública: presentación, servicios y planes | público | ✅ implementada |
| `/#about` | Ancla “Sobre Olimpo” | público | ✅ implementada |
| `/#services` | Ancla de servicios | público | ✅ implementada |
| `/#pricing` | Ancla de precios | público | ✅ implementada |
| `/login` | Login (slider de dos pasos) | público | ✅ implementada |
| `/dashboard` | Panel | autenticados | ✅ implementada |
| `/clients` | Directorio de filas que enlazan a la ficha independiente | `ADMIN`, `RECEPCIONIST` | ✅ implementada |
| `/clients/new` | Nuevo cliente | `ADMIN`, `RECEPCIONIST` | ✅ implementada |
| `/clients/:id` | Ficha del cliente | `ADMIN`, `RECEPCIONIST`; `CLIENT` solo el propio | ✅ implementada |
| — | Renovación de membresía (modal en la ficha, sin ruta propia) | `ADMIN`, `RECEPCIONIST` | ✅ implementada |
| `/payments` | Pagos por cliente | `ADMIN`, `RECEPCIONIST` | ✅ implementada |
| `/design` | Página de diseño | solo desarrollo | ✅ implementada |
| `/inventory` | Tarjetas de inventario, búsqueda, filtro de stock bajo y resumen de atención | `ADMIN`, `TRAINER_MANAGER`, `TRAINER` | ✅ implementada |
| `/inventory/:itemId` | Ficha del ítem con movimientos `INBOUND`/`OUTBOUND` | `ADMIN`, `TRAINER_MANAGER`, `TRAINER` | ✅ implementada |
| `/machines` | Tarjetas de máquinas, búsqueda, filtro de estado y resumen | `ADMIN`, `TRAINER_MANAGER`, `TRAINER` | ✅ implementada |
| `/schedules` | Malla semanal por entrenador: ledger lunes→domingo; `ADMIN`/`TRAINER_MANAGER` editan, `TRAINER` consulta la propia en solo lectura | `ADMIN`, `TRAINER_MANAGER`; `TRAINER` solo el propio | ✅ implementada |
| `/routines` | Rutinas | catálogo: autenticados; crear/asignar: `ADMIN`, `TRAINER_MANAGER`, `TRAINER` | ✅ implementada |
| `/routines/:routineId` | Ficha de la rutina con asignaciones | autenticados; asignar: `ADMIN`, `TRAINER_MANAGER`, `TRAINER` | ✅ implementada |
| `/users` | Usuarios | `ADMIN` | ⏳ planificada |
| `*` | 404 | — | ✅ implementada |

Reglas de navegación:

- La home pública tiene navegación por anclas a presentación, “Sobre Olimpo”, servicios y precios; incluye CTA a `/login`. El acceso al sistema no requiere iniciar sesión para explorar la home.
- El encabezado autenticado usa un menú de usuario compacto; agrupa cada enlace bajo los roles que lo habilitan y filtra rutas con la misma política del guard.
- Preferencias de tema, acceso a Diseño (solo desarrollo) y cierre de sesión viven dentro del menú, no como botones separados en la barra superior.
- Un guard por ruta valida sesión y rol; si falta sesión → `/login`; si falta rol → 403 sin filtrar detalles.
- Después del login, se abre la ruta protegida solicitada originalmente o `/dashboard`; cerrar sesión devuelve a `/login`. `/` permanece como home pública.
- `RECEPCIONIST` no ve Inventario ni Máquinas (decisión de negocio, no un olvido).
- `CLIENT` no ve el directorio; solo su ficha y sus rutinas.

---

## 4. Fases

### F1 — Fundación visual

**Objetivo:** que el lenguaje v4 exista en código antes de cualquier feature.

**Entregables**

- Scaffold Vite + React + TS, Tailwind 4, alias `@/`.
- `tokens.css` con dark/light y `ThemeProvider` persistido.
- Primitivos `panel`, `panelHead`, `metric`, `status`, `tag`, `toast`, `fieldError`, `modal`, `button`, `input`, `field`, `icon`.
- `appShell`: header sticky de 68px, navegación de texto con icono, footer con meandro.
- Página de muestra `/design` (solo dev) con todos los primitivos en ambos temas.
- `toastHost` global y `fieldError` reutilizable para errores asociados a campos.

**API:** ninguna.

**Aceptación**

- La muestra reproduce el shell y los primitivos del mockup v4 sin gradientes, rellenos tintados ni sombras en cards.
- Contraste ≥4.5:1 en texto y placeholders; foco visible en todo control.
- Teclado: navegación completa, `Esc` cierra modal y toast.
- `prefers-reduced-motion` deja el contenido sin animación.
- `pnpm run build` y `pnpm run lint` en verde.

### F1.5 — Home pública y primera visita

**Objetivo:** ofrecer una página pública que presente Olimpo antes del login y permita explorar qué ofrece el gimnasio.

**Ruta y estructura**

- `GET /` sirve la home pública y permanece accesible sin sesión.
- La página vive en `src/features/home/`; sus secciones, contenido y animaciones específicas se mantienen dentro de esa entidad. Se reutilizan los primitivos globales de `components/ui`.
- Navegación con anclas a `/#about`, `/#services` y `/#pricing`, más una acción clara para iniciar sesión en `/login`.
- El panel autenticado se sirve en `/dashboard`; esta separación evita colisionar la portada pública con el destino posterior al login.

**Contenido**

- Hero de bienvenida con propuesta de valor, identidad de Olimpo y CTA hacia servicios/precios e inicio de sesión.
- Sección “Sobre Olimpo” (o “Sobre mí” si se confirma una marca personal); presentar solo historia y datos aprobados por el negocio.
- Sección de servicios en cards con icono, nombre y descripción breve; usar profundidad 3D sutil sin sombras duras y respetar `prefers-reduced-motion`.
- Sección de precios/planes con cada membresía presentada en su propia tarjeta comparativa; mostrar monto, moneda, vigencia y condiciones reales, legibles y comparables.
- Cierre con CTA y datos de contacto solo si se suministran.
- Contenido amplio y útil en una página de desplazamiento largo, organizado por jerarquía, anclas y aire visual. No llenar la página con grids repetidos, cards anidadas ni bloques decorativos; mantener un máximo de 3 regiones principales por viewport.
- No inventar precios, promociones, testimonios, instalaciones, horarios, ubicación ni resultados. Recabar el texto de “Sobre Olimpo”, catálogo, tarifas y condiciones antes de publicar esos datos; los placeholders no se presentan como información real.

**Dirección visual y movimiento**

- Conservar la identidad negro editorial, tokens, tipografía y reglas de color de `docs/FRONTEND_BASE.md`; esta fase amplía la narrativa y densidad informativa, no crea una identidad visual separada.
- Hacer reconocible el carácter olímpico de Olimpo con referencias helénicas arquitectónicas, el glifo de columna y el meandro, manteniendo la jerarquía editorial y evitando ornamento genérico.
- Componer una secuencia de movimiento más rica que la UI operativa, pero breve y con propósito: entrada escalonada del hero, revelado único de secciones al entrar en viewport y microinteracciones de foco/hover en enlaces y acciones.
- Las animaciones no deben ocultar información, bloquear interacción ni repetirse continuamente; sin parallax ni movimiento permanente. Respetar `prefers-reduced-motion` mostrando el contenido inmediatamente.

**Aceptación**

- `/` muestra todas las secciones públicas y funciona sin sesión; cada ancla lleva a su sección y el CTA de acceso llega a `/login`.
- La ruta `/dashboard` queda reservada al panel autenticado y no se expone como contenido público.
- Servicios, precios y datos del gimnasio provienen de información entregada por el negocio; no hay cifras o afirmaciones de ejemplo en producción.
- El contenido es rico pero escaneable, con jerarquía clara, responsive en los breakpoints del §6 y sin exceder 3 regiones principales visibles.
- La secuencia de movimiento es perceptible pero no distrae; la versión con movimiento reducido presenta el mismo contenido y funcionalidad.
- Teclado, foco visible, contraste y enlaces ancla funcionan en móvil y escritorio.

### F2 — Autenticación y navegación por rol

**Objetivo:** sesión real contra el backend y shell filtrado por rol.

**API**

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

**Entregables**

- **Login de dos pasos en slider**: lista vertical de roles (icono + label + summary + chevron); al elegir uno la tarjeta se desliza al formulario de credenciales, que reacciona al rol (título, resumen y pistas); botón "Cambiar rol" regresa. Error 401 como toast. No existe `/register`: el alta se hace en recepción.
- Navegación móvil en el shell autenticado: bajo 821px el header muestra un botón de menú con los mismos enlaces filtrados por rol, cierre por Escape y al cambiar de ruta.
- `authStore` con token, email, roles, perfil y expiración; persistencia por pestaña en `sessionStorage` (sin guardar contraseñas).
- Refresh programado antes de `expiresIn`; un solo reintento ante 401.
- Guards por rol y menú derivado de `roles`; el panel protegido vive en `/dashboard`.
- Logout que limpia store, caché de Query y redirige a `/login`; la home pública `/` sigue accesible.
- La API usa `/api/v1` por defecto; Vite reenvía `/api` a `http://localhost:8080` durante desarrollo y `VITE_API_URL` permite configurar otra base.

**Aceptación**

- Correo vacío/inválido y contraseña vacía muestran errores inline, sin toast; se limpian al editar el campo.
- Un 401 de credenciales muestra toast y marca ambos campos con un aviso inline hasta que cada uno cambie.
- Los errores de validación del backend que identifiquen un campo también lo marcan; los errores globales/de negocio siguen usando toast.
- El login explica el rol antes de entrar y deja claro que el rol real lo determina la cuenta.
- La navegación por rol funciona en escritorio y en móvil; ningún enlace permitido queda inaccesible.
- La sesión sobrevive a recarga y se cierra sola al expirar sin refresh válido.
- Un rol sin permiso no ve el enlace ni puede entrar por URL.
- Sin `passwordHash` ni datos sensibles en el cliente.

### F3 — Clientes y membresías

**Objetivo:** el flujo completo del mockup: directorio, alta, ficha y renovación.

**API**

- `GET /api/v1/clients?page&size&search`
- `POST /api/v1/clients`
- `GET /api/v1/clients/{id}`
- `GET /api/v1/clients/{id}/memberships?page&size`
- `GET /api/v1/clients/{id}/payments?page&size`
- `POST /api/v1/memberships`
- `GET /api/v1/memberships/active?clientId=`
- `PATCH /api/v1/memberships/{id}/renew`

**Entregables**

- Directorio en filas oscuras con búsqueda debounced, paginación, datos de contacto/status y enlace a la ficha independiente.
- Alta con RHF + zod: correo único, contraseña inicial, documento y datos de perfil que expone `CreateClientRequest`; membresía inicial opcional mediante `POST /memberships`. No se captura dirección porque el contrato actual no incluye ese campo.
- Ficha independiente y responsive: identidad, membresía, datos, historial y pagos en secciones; la barra de progreso de membresía es accesible.
- Renovación en modal con la regla `max(endDate, hoy)` visible y fecha calculada.
- Validaciones 400 asociadas a un campo también se muestran junto al input con borde rojo y foco; los errores globales y los conflictos 404/409 usan toast.

**Aceptación**

- Crear cliente refresca el directorio sin recargar la página.
- Renovar extiende desde `max(fin actual, hoy)` y refleja el nuevo fin.
- Un segundo intento de membresía activa devuelve 409 y se muestra como toast.
- El historial y los pagos se leen sin saturar: la ficha agrupa identidad, membresía e historial/pagos en 2–3 regiones, sin cards anidadas.

### F4 — Pagos

**Objetivo:** registrar y consultar pagos sin inventar un listado global que el backend no expone.

**API**

- `POST /api/v1/payments`
- `GET /api/v1/clients/{id}/payments?page&size`
- Reutiliza `GET /api/v1/clients?page&size&search` y `GET /api/v1/clients/{id}/memberships?page&size` de F3 para buscar cliente y asociar el pago a una membresía.

**Entregables**

- Página `/payments` con búsqueda de cliente y su historial paginado.
- Formulario para seleccionar membresía y registrar monto, método y referencia opcional con validación espejo del DTO. La fecha se asigna en el servidor y se muestra en el historial; el contrato actual no admite concepto ni fecha manual.
- Total del cliente calculado en cliente solo si el backend lo entrega; si no, se muestra el acumulado de la página actual con etiqueta clara.

**Aceptación**

- Registrar un pago invalida el historial del cliente y recalcula el acumulado visible de la página actual.
- Errores locales y de validación 400 asociados a membresía, monto, método o referencia se muestran inline; los errores de negocio y globales usan toast.
- No se muestra un “total global” que el contrato no pueda sostener.

### F4.5 — Consolidación visual y documental V1.0.0

**Objetivo:** cerrar la iteración visual de F4/F5 y dejar una referencia estable para la primera versión.

- Durante el trabajo de F5 se exploraron distintas composiciones para directorios y fichas; se conserva como estilo final el diseño oscuro que está actualmente en el código.
- La ficha de cliente queda como página independiente en `/clients/:id`; el directorio enlaza a ella.
- Inventario y máquinas conservan sus directorios de tarjetas, resúmenes laterales y estados/acciones actuales.
- Se alinean la base visual, los planes y la documentación de rutas/API con el comportamiento existente.
- F1, F2 y F3 quedan fuera de alcance de esta consolidación; no se alteran sus flujos.

### F5 — Inventario y máquinas (implementado)

**Objetivo:** operación de inventario con roles correctos.

**API**

- `GET|POST /api/v1/inventory/items`
- `GET /api/v1/inventory/items/low-stock`
- `GET|PATCH /api/v1/inventory/items/{id}`
- `DELETE /api/v1/inventory/items/{id}` (elimina también el historial de movimientos del ítem)
- `GET|POST /api/v1/inventory/items/{id}/movements`
- `GET|POST /api/v1/machines`
- `GET|PATCH /api/v1/machines/{id}`
- `DELETE /api/v1/machines/{id}`

**Entregables**

- Directorio de inventario con tarjetas, búsqueda, filtro de stock bajo y resumen de atención.
- Directorio de máquinas con tarjetas, búsqueda, filtro por estado y resumen.
- Detalle con movimientos `INBOUND`/`OUTBOUND`.
- Alta/edición y eliminación confirmada de ítems y máquinas.
- Guard que excluye a `RECEPCIONIST`.

**Aceptación**

- `OUTBOUND` mayor al stock devuelve 409 y toast.
- Serial duplicado devuelve 409 y toast.
- Estados inválidos no se pueden enviar desde la UI.
- Eliminar un ítem elimina también su historial de movimientos; la acción requiere confirmación.

### F6 — Horarios y rutinas (implementado)

**Objetivo:** malla semanal y rutinas con la semántica de días del backend.

**API**

- `GET|POST /api/v1/trainers/{trainerId}/schedules`
- `GET /api/v1/routines?page&size&type&search`
- `GET /api/v1/routines/{id}`
- `POST /api/v1/routines`
- `POST /api/v1/routines/{id}/assignments`
- `GET /api/v1/routines/{id}/assignments?page&size`
- `GET /api/v1/clients/{clientId}/routines?page&size`

**Entregables**

- Malla semanal con **1 = domingo … 7 = sábado** mapeada a etiquetas humanas.
- `POST` reemplaza el plan semanal completo; la UI advierte que es una sustitución.
- Rutinas `GENERAL` sin precio ni trainer; `CUSTOM` con precio > 0 y trainer.
- Asignación con estados `ACTIVE`, `COMPLETED`, `CANCELLED`.
- `TRAINER` solo ve su propia malla y la consulta en **modo lectura**; `ADMIN`/`TRAINER_MANAGER` editan cualquiera.

**Diseño implementado (2026-11-22, ajustado 2026-11-24):** la semana es un ledger de una columna con el día en un raíl a la izquierda y sus bloques a la derecha; en pantalla el orden es **lunes → domingo**, mientras la API conserva `1 = domingo … 7 = sábado`. Los días vacíos se comprimen a una línea con acción directa “Añadir”, y el alta de bloques vive en un panel propio (4 campos en una fila en escritorio, 2×2 en tablet y 1 columna en móvil). Para un `TRAINER` sin rol de supervisión se ocultan el formulario de alta, el guardado y las acciones de borrado: cada bloque se muestra como hora + estado y la cabecera indica “Solo lectura”.

**Aceptación**

- Solapamiento en el mismo día devuelve 409 y toast.
- `endTime > startTime` validado antes de enviar.
- La UI no permite `GENERAL` con precio ni `CUSTOM` sin trainer/precio.
- Un trainer no puede abrir la malla de otro por URL.

### F7 — Accesibilidad, pruebas y entrega

**Objetivo:** cerrar el producto con datos reales y calidad verificable.

**Entregables**

- ~~Panel en `/dashboard` con los 3 bloques del mockup **solo cuando existan endpoints que los sostengan**.~~ Implementado: panel por rol con tarjetas de indicadores, paneles de trabajo, acciones rápidas y atajos, alimentado solo por endpoints existentes.
- Estados de carga con texto y hairlines (sin shimmer llamativo), vacío y error.
- Responsive 1180 / 1020 / 820 / 560; header sin desbordes.
- Pruebas: unitarias de primitivos, integración de features con MSW, E2E de login/cliente/renovación.
- CI: lint + test + build en cada PR.
- Documentación de rutas, roles y variables de entorno.

**Aceptación**

- Cada pantalla cumple el contrato visual y el Definition of Done de §6.
- Sin datos inventados: si falta un endpoint, se muestra un estado “no disponible” honesto.
- Bundle inicial razonable y rutas con code splitting.
- `docs/FRONTEND_BASE.md` y este plan siguen siendo ciertos.

---

## 5. Datos, errores y formularios

### Capa de API

- `apiFetch<T>` centraliza base URL, `Authorization: Bearer`, JSON y parseo de error.
- Error tipado: `ApiError { status, error, message }` con la forma única del backend.
- Nunca se muestra stack, SQL ni nombre de clase.

### TanStack Query

- `staleTime` 30s; `retry` 1; sin refetch agresivo al enfocar.
- Query keys explícitas: `['clients', { page, size, search }]`, `['client', id]`, `['client', id, 'memberships', page]`, `['client', id, 'payments', page]`, `['inventory', { page, size, search }]`, `['routines', { page, size, type, search }]`.
- Toda mutación invalida las keys afectadas; no se actualiza la caché a mano salvo caso justificado.

### Errores

| Origen | UI |
|---|---|
| 400 validación | mensaje inline y borde rojo en los campos identificados por el backend, además de toast |
| 401 sesión | intento único de refresh; si falla, logout + toast |
| 403 | toast genérico; no se revela el recurso |
| 404 | toast “no encontrado” y vuelta a la lista |
| 409 | toast con la regla de negocio |
| 500 | toast genérico; detalle solo en consola/log |

- Cero banners y fondos rojos; el borde rojo se reserva al input inválido.
- Los formularios usan zod espejo de los DTO; errores locales aparecen inline sin toast, y los errores de campo identificados por el backend aparecen inline además del toast.

### Fechas y dinero

- Fechas de contrato en ISO `YYYY-MM-DD`; visualización con `Intl.DateTimeFormat('es-CO')`.
- Sin conversiones de zona que muevan el día de una membresía.
- Moneda COP con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.

---

## 6. Calidad y Definition of Done

Cada pantalla se considera terminada cuando:

- [ ] Cumple las 12 reglas del contrato visual.
- [ ] No hay gradientes, rellenos tintados, chips rellenos ni sombras en cards.
- [ ] Errores de campo inline con `fieldError`; errores globales/de negocio como toast; ningún banner.
- [ ] Máximo 3 bloques principales (regiones) por vista; sin cards anidadas.
- [ ] Contraste ≥4.5:1 en texto y placeholders; foco visible.
- [ ] Teclado completo; `Esc` cierra capas; `aria-invalid` en campos con error.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Responsive probado en 1180 / 1020 / 820 / 560.
- [ ] Sin hex fuera de tokens; sin `any` en la capa de API.
- [ ] Estados de carga, vacío y error implementados.
- [ ] Pruebas de la feature en verde.
- [ ] El contrato `/api/v1` no cambió.

---

## 7. Brechas de contrato detectadas

El mockup muestra más de lo que el backend expone hoy. El frontend **no inventa datos**; estas necesidades se proponen al perfil backend:

1. **Panel agregado:** no hay endpoint de métricas (clientes activos, membresías activas, ingresos del mes).
2. **Asistencia semanal:** no existe tabla/endpoint de visitas; el gráfico del mockup queda pendiente.
3. **Pagos globales:** solo existe `POST /payments` y el historial por cliente; no hay listado global.
4. **Membresías globales/por vencer:** no hay listado global ni filtro por vencimiento.
5. **Autoservicio `CLIENT`:** resuelto en la práctica con `GET /clients/lookup`, que devuelve solo el registro propio del cliente autenticado; no hace falta añadir `clientId` a `/auth/me`.
6. **CORS:** el backend aún no configura orígenes del frontend; se propone `CORS` para dev y producción.

Mientras esas brechas existan, las vistas afectadas muestran solo lo que el contrato sostiene y un estado “no disponible” honesto. El mockup sigue siendo la meta visual, no una promesa de datos.

---

## 8. Riesgos y decisiones

- **Astryx 0.7.14 (versión exacta):** encapsulado en `components/ui`; una actualización no debe tocar features.
- **Token en cliente:** `sessionStorage` por pestaña + refresh programado con margen proporcional; evaluar cookies httpOnly si el backend las ofrece.
- **Sin navegador en el entorno del agente:** la verificación visual se hace contra el mockup y con axe/Playwright cuando haya entorno navegable.
- **Roles múltiples:** un usuario puede tener varios roles; la UI une permisos y muestra la unión, no el primero.
- **Fechas:** la regla `max(endDate, today)` se calcula en backend; la UI solo la muestra y valida formato.
- **Datos del panel:** no se implementan métricas decorativas; primero endpoint, luego vista.

---

## 9. Estado actual y próximos pasos

Implementado: F1 (fundación visual), F1.5 (home pública), F2 (auth con login en slider), F3 (clientes: directorio y ficha independiente), F4 (pagos), F4.5 (consolidación visual/documental V1.0.0), F5 (inventario y máquinas), F6 (horarios y rutinas) y el panel por rol de F7. En este cierre pasaron `pnpm build`, `pnpm lint` (solo el aviso preexistente de React Compiler en `useMembershipAction`), la suite completa del backend (192/192) y la verificación visual del panel y de la malla en lectura para los cinco roles.

Siguiente fase — **F7 (accesibilidad, pruebas y entrega)**, con el panel ya cerrado:

1. Revisión de accesibilidad (foco, teclado, contraste) y responsive 1180 / 1020 / 820 / 560 en todas las pantallas.
2. Pruebas de integración con MSW y E2E de login, cliente y renovación; CI con lint + test + build.
3. Documentación de rutas, roles y variables de entorno.
4. Módulo de usuarios (hoy en `plannedFeaturePage`).
