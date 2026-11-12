# FRONTEND_PLAN.md — Plan de implementación del frontend Olimpo

Estado: aprobado para ejecución · Última actualización: 2026-11-12
Alcance: `front/` (React SPA) consumiendo `/api/v1` **sin modificar el contrato**.

Fuentes de verdad:

- `docs/FRONTEND_BASE.md` — identidad, tokens, componentes y movimiento (fuente visual canónica).
- `docs/ARCHITECTURE.md` — rutas, roles, errores y reglas de negocio.
- `docs/AGENTS.md` — convenciones del repositorio.

---

## 0. Contrato visual vinculante

Estas reglas son criterio de aceptación, no inspiración. Se aplican a cada pantalla, estado y breakpoint.

1. **El fondo siempre es negro.** Superficies negro cálido (`--bg`, `--panel`, `--panel-2`). Nunca se rellena un contenedor con color de estado ni con tinte de marca.
2. **Solo bordes.** La separación es un borde de 1px neutro (`--line` / `--line-strong`). El color no pinta bordes de contenedores.
3. **Los errores siempre son pops.** Todo error se comunica con un **toast** flotante: superficie negra, borde neutro, icono de color, título y recuperación. Prohibidos banners inline, bloques con fondo de color y bordes de color.
4. **La información no satura.** Máximo **3 bloques principales (regiones)** por vista. Los detalles se agrupan en subsecciones con hairline dentro de un bloque, no en cards adicionales. Las métricas se leen como texto, no como cards. Las tablas muestran lo esencial; el resto vive en el detalle.
5. **Cero gradientes.** Ni fondos, ni botones, ni texto, ni tarjetas.
6. **Cero chips rellenos.** El estado es un **punto de 6px + texto**; una etiqueta es solo borde de 1px sin fondo.
7. **Sin sombras en cards.** La elevación se declara con el borde. La sombra queda solo para capas flotantes (toast y modal).
8. **Navegación por texto con icono funcional.** Barra superior, sin sidebar. Cada enlace lleva un icono de línea que lo representa; nunca ilustraciones ni iconos rellenos.
9. **Dorado con disciplina.** Solo en marca, icono del enlace activo, icono de sección en hover, borde/texto de la acción principal, foco y cifras clave. Nunca como relleno.
10. **Densidad y aire.** Página 56/32, bloques separados 24–32, paneles con 24 de padding. Más espacio sobre un título que debajo.
11. **Iconografía de línea.** Sprite SVG en mockup; `react-icons/lu` en React. Trazo 1.7, tamaños 12–22px, color heredado. Siempre acompañan a texto.
12. **Movimiento silencioso.** Entrada de página con subida corta y stagger, trazo del gráfico, hover de borde/avatar/icono. Sin movimiento continuo. `prefers-reduced-motion` desactiva todo.

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

`Panel`, `PanelHead`, `Metric`, `MetricStrip`, `Row`, `DataTable`, `Status`, `Tag`, `Toast`, `Modal`, `Button`, `IconButton`, `Input`, `Select`, `Field`, `SearchInput`, `Pagination`, `EmptyState`, `Avatar`, `Meander`, `Icon`.

Las features no importan Astryx directamente: todo pasa por `components/ui`, que encapsula accesibilidad, tokens y variantes.

---

## 1. Stack y convenciones

| Herramienta | Rol |
|---|---|
| Vite + React 19 + TypeScript | base de la SPA |
| Astryx (`@astryxdesign/core` + `theme-neutral`) | controles accesibles; versión exacta fijada en `package.json` |
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
- Identificadores en inglés y camelCase; archivos de componentes en kebab-case.
- Sin secretos en el repositorio. La URL de API sale de `VITE_API_URL`.
- No se cambia el contrato `/api/v1`. Cualquier necesidad nueva se propone al perfil backend.
- Los mockups de `front/mockup/` son referencia local, git-ignored; no se copian a producción, se recrean con componentes.

---

## 2. Estructura propuesta

```text
front/
├─ mockup/                     # referencia visual, nunca se sube
├─ public/
└─ src/
   ├─ app/
   │  ├─ router.tsx
   │  ├─ providers.tsx
   │  └─ guards.tsx
   ├─ components/
   │  ├─ layout/               # AppShell, SiteHeader, SiteNav, SiteFooter, PageHead
   │  └─ ui/                   # primitivos del contrato visual
   ├─ features/
   │  ├─ auth/
   │  ├─ dashboard/
   │  ├─ clients/
   │  ├─ memberships/
   │  ├─ payments/
   │  ├─ inventory/
   │  ├─ machines/
   │  ├─ schedules/
   │  └─ routines/
   ├─ lib/                     # api, queryClient, errors, format, dates
   ├─ stores/                  # authStore, themeStore, toastStore
   ├─ styles/                  # tokens.css, globals.css
   └─ types/                   # espejo de DTO de respuesta/request
```

---

## 3. Rutas y permisos

| Ruta | Vista | Roles |
|---|---|---|
| `/login` | Login | público |
| `/` | Panel | autenticados |
| `/clients` | Directorio | `ADMIN`, `RECEPCIONIST` |
| `/clients/new` | Nuevo cliente | `ADMIN`, `RECEPCIONIST` |
| `/clients/:id` | Ficha del cliente | `ADMIN`, `RECEPCIONIST`; `CLIENT` solo el propio |
| `/clients/:id/renew` | Renovación (modal) | `ADMIN`, `RECEPCIONIST` |
| `/payments` | Pagos por cliente | `ADMIN`, `RECEPCIONIST` |
| `/inventory` | Inventario | `ADMIN`, `TRAINER_MANAGER`, `TRAINER` |
| `/machines` | Máquinas | `ADMIN`, `TRAINER_MANAGER`, `TRAINER` |
| `/schedules` | Horarios | `ADMIN`, `TRAINER_MANAGER`; `TRAINER` solo el propio |
| `/routines` | Rutinas | catálogo: autenticados; crear/asignar: `ADMIN`, `TRAINER_MANAGER`, `TRAINER` |
| `/users` | Usuarios | `ADMIN` |
| `*` | 404 | — |

Reglas de navegación:

- El header filtra enlaces por rol y muestra **máximo 6**; el resto va en un grupo de texto “Administración”.
- Un guard por ruta valida sesión y rol; si falta sesión → `/login`; si falta rol → 403 sin filtrar detalles.
- `RECEPCIONIST` no ve Inventario ni Máquinas (decisión de negocio, no un olvido).
- `CLIENT` no ve el directorio; solo su ficha y sus rutinas.

---

## 4. Fases

### F1 — Fundación visual

**Objetivo:** que el lenguaje v4 exista en código antes de cualquier feature.

**Entregables**

- Scaffold Vite + React + TS, Tailwind 4, alias `@/`.
- `tokens.css` con dark/light y `ThemeProvider` persistido.
- Primitivos `Panel`, `PanelHead`, `Metric`, `Status`, `Tag`, `Toast`, `Modal`, `Button`, `Input`, `Field`, `Icon`.
- `AppShell`: header sticky de 68px, navegación de texto con icono, footer con meandro.
- Página de muestra `/design` (solo dev) con todos los primitivos en ambos temas.
- `ToastHost` global; ningún componente puede renderizar errores inline.

**API:** ninguna.

**Aceptación**

- La muestra reproduce el shell y los primitivos del mockup v4 sin gradientes, rellenos tintados ni sombras en cards.
- Contraste ≥4.5:1 en texto y placeholders; foco visible en todo control.
- Teclado: navegación completa, `Esc` cierra modal y toast.
- `prefers-reduced-motion` deja el contenido sin animación.
- `npm run build` y `npm run lint` en verde.

### F2 — Autenticación y navegación por rol

**Objetivo:** sesión real contra el backend y shell filtrado por rol.

**API**

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

**Entregables**

- Login del mockup con iconos de correo/candado y error 401 como toast.
- `authStore` con token, email y roles; persistencia controlada.
- Refresh programado antes de `expiresIn`; un solo reintento ante 401.
- Guards por rol y menú derivado de `roles`.
- Logout que limpia store, caché de Query y redirige.

**Aceptación**

- Credenciales inválidas muestran toast, nunca banner.
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

- Directorio con búsqueda debounced, paginación y fichas mínimas (3 datos + 2 acciones).
- Alta con RHF + zod: correo único, documento, teléfono, dirección y membresía inicial opcional.
- Ficha con membresía actual, historial, pagos y datos personales.
- Renovación en modal con la regla `max(endDate, hoy)` visible y fecha calculada.
- 400/409/404 como toast; el campo inválido recibe `aria-invalid` y foco, sin borde ni fondo de color.

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

**Entregables**

- Página `/payments` con búsqueda de cliente y su historial paginado.
- Formulario de registro de pago (monto, método, concepto, fecha) con validación espejo del DTO.
- Total del cliente calculado en cliente solo si el backend lo entrega; si no, se muestra el acumulado de la página actual con etiqueta clara.

**Aceptación**

- Registrar un pago invalida el historial del cliente y el resumen.
- Errores de validación y de negocio siempre como toast.
- No se muestra un “total global” que el contrato no pueda sostener.

### F5 — Inventario y máquinas

**Objetivo:** operación de inventario con roles correctos.

**API**

- `GET|POST /api/v1/inventory/items`
- `GET /api/v1/inventory/items/low-stock`
- `GET|PATCH /api/v1/inventory/items/{id}`
- `GET|POST /api/v1/inventory/items/{id}/movements`
- `GET|POST /api/v1/machines`
- `GET|PATCH /api/v1/machines/{id}`

**Entregables**

- Listado con búsqueda, stock bajo y estado (punto + texto).
- Detalle con movimientos `INBOUND`/`OUTBOUND`.
- Alta/edición de ítem y máquina.
- Guard que excluye a `RECEPCIONIST`.

**Aceptación**

- `OUTBOUND` mayor al stock devuelve 409 y toast.
- Serial duplicado devuelve 409 y toast.
- Estados inválidos no se pueden enviar desde la UI.

### F6 — Horarios y rutinas

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
- `TRAINER` solo ve y edita su propia malla; manager/admin, cualquiera.

**Aceptación**

- Solapamiento en el mismo día devuelve 409 y toast.
- `endTime > startTime` validado antes de enviar.
- La UI no permite `GENERAL` con precio ni `CUSTOM` sin trainer/precio.
- Un trainer no puede abrir la malla de otro por URL.

### F7 — Panel completo, accesibilidad y entrega

**Objetivo:** cerrar el producto con datos reales y calidad verificable.

**Entregables**

- Panel con los 3 bloques del mockup **solo cuando existan endpoints que los sostengan**.
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
| 400 validación | toast con el mensaje del backend; foco al primer campo inválido |
| 401 sesión | intento único de refresh; si falla, logout + toast |
| 403 | toast genérico; no se revela el recurso |
| 404 | toast “no encontrado” y vuelta a la lista |
| 409 | toast con la regla de negocio |
| 500 | toast genérico; detalle solo en consola/log |

- Cero banners, cero bloques rojos, cero bordes de color.
- Los formularios usan zod espejo de los DTO; los mensajes visibles salen del backend cuando existen.

### Fechas y dinero

- Fechas de contrato en ISO `YYYY-MM-DD`; visualización con `Intl.DateTimeFormat('es-CO')`.
- Sin conversiones de zona que muevan el día de una membresía.
- Moneda COP con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.

---

## 6. Calidad y Definition of Done

Cada pantalla se considera terminada cuando:

- [ ] Cumple las 12 reglas del contrato visual.
- [ ] No hay gradientes, rellenos tintados, chips rellenos ni sombras en cards.
- [ ] Los errores son toasts; no existe ningún banner de error.
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
5. **Autoservicio `CLIENT`:** `/auth/me` no devuelve `clientId`; se propone añadirlo o crear `/clients/me`.
6. **CORS:** el backend aún no configura orígenes del frontend; se propone `CORS` para dev y producción.

Mientras esas brechas existan, las vistas afectadas muestran solo lo que el contrato sostiene y un estado “no disponible” honesto. El mockup sigue siendo la meta visual, no una promesa de datos.

---

## 8. Riesgos y decisiones

- **Astryx beta:** encapsular en `components/ui`; una actualización no debe tocar features.
- **Token en cliente:** persistencia controlada + refresh programado; evaluar `sessionStorage` si el riesgo XSS pesa más que la comodidad.
- **Sin navegador en el entorno del agente:** la verificación visual se hace contra el mockup y con axe/Playwright cuando haya entorno navegable.
- **Roles múltiples:** un usuario puede tener varios roles; la UI une permisos y muestra la unión, no el primero.
- **Fechas:** la regla `max(endDate, today)` se calcula en backend; la UI solo la muestra y valida formato.
- **Datos del panel:** no se implementan métricas decorativas; primero endpoint, luego vista.

---

## 9. Primer paso

Cerrar **F1** completo antes de tocar features:

1. Scaffold y tokens.
2. Primitivos y `ToastHost`.
3. `AppShell` con header/footer.
4. Página `/design` en oscuro y claro.
5. Revisión contra `front/mockup/` y checklist de §6.

Con F1 aprobado, F2 (auth) y F3 (clientes) se ejecutan en ese orden.
