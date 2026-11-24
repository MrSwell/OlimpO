# 🏛️ Olimpo — Sistema de gestión de gimnasio

Monorepo del sistema web de gestión de gimnasio: usuarios con roles, membresías y pagos, inventario con alertas de stock, malla horaria de entrenadores y rutinas de entrenamiento.

## Estructura del repositorio

```
OlimpO/
├── back/      # Backend Spring Boot 4 (Java 27 + MySQL 8) — API /api/v1
├── docs/      # Documentación técnica y planes de prueba
│   ├── AGENTS.md          # Convenciones y persona del agente según carpeta
│   ├── ARCHITECTURE.md    # Diagramas de flujo, módulos, acceso por ruta
│   ├── FRONTEND_BASE.md   # Identidad visual y directivas de estilo del frontend
│   ├── FRONTEND_PLAN.md   # Plan de implementación del frontend (fases, rutas)
│   └── POSTMAN.md         # Plan de pruebas (~90 casos) para la IA de Postman
└── front/     # Frontend React (SPA) — F1–F6 + panel por rol; estilo V1.0.0 consolidado
```

> **Header de la API**: todas las rutas del backend responden JSON bajo `/api/v1/**`.

## Stack del backend

| Capa | Tecnología |
|------|------------|
| Java | 27 (`C:\Program Files\Java\jdk-27`) |
| Framework | Spring Boot 4.1.2 (web, security, validation, data-jpa) |
| Seguridad | Spring Security 7 + JWT (jjwt 0.12.6), stateless |
| Datos | MySQL 8 + Hibernate (JavaTimeModule) + Flyway ↓ |
| Migraciones | Flyway (baseline en V5, futuras = V7+) |
| Build | Maven wrapper (`mvnw.cmd`) |

## Estructura del proyecto (back/)

```
back/src/main/java/server.olimpo
├── config/            # SecurityConfig, AdminUserInitializer (seed dev)
├── controller/        # Endpoints REST /api/v1/**
├── dto/
│   ├── request/       # Records de entrada (con validación)
│   └── response/      # Records de salida (nunca hash de contraseña)
├── entity/            # Entidades JPA (tablas MySQL)
├── enums/             # USER_STATUS, MEMBERSHIP_*, ROUTE_*, etc.
├── exception/         # BusinessException, ResourceNotFoundException
│                      #   y GlobalExceptionHandler (formato único de errores)
├── repository/        # Spring Data JPA
├── security/          # JwtService, JwtAuthenticationFilter, UserDetailsServiceImpl
└── service/           # Reglas de negocio por módulo
```

## Puesta en marcha (back/)

1. **MySQL 8** corriendo en `127.0.0.1:3306` con base `olimpo` creada a partir de las migraciones (`back/src/main/resources/db/migration/V1…V6`).
2. En `back/`, copia `.env.example` → `.env` y completa credenciales:

   ```properties
   DB_USERNAME=root
   DB_PASSWORD=tu_clave
   JWT_SECRET=al-menos-32-caracteres-aleatorios
   JWT_EXPIRATION_MS=86400000
   SHOW_SQL=true
   ```

3. Arranca (desde `back/`):

   ```powershell
   cd back
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-27"
   .\mvnw.cmd spring-boot:run
   ```

   La app queda en **http://localhost:8080**; los logs van a `run.log` si rediriges la salida.
   Con devtools activo, `mvnw compile` recarga la app sin reiniciar el proceso.

## Puesta en marcha (front/)

1. Requisitos: Node 20+ y **pnpm** (no usar npm).
2. Instala y arranca (desde `front/`):

   ```powershell
   cd front
   pnpm install
   pnpm dev
   ```

   La SPA queda en la URL que imprime Vite (por defecto **http://localhost:5173**).

3. Scripts útiles:

   | Script | Acción |
   |--------|--------|
   | `pnpm dev` | Servidor de desarrollo con HMR |
   | `pnpm build` | Verificación de tipos (`tsc -b`) + build de producción en `dist/` |
   | `pnpm lint` | Oxlint |
   | `pnpm preview` | Sirve el build de producción |

4. Conexión con la API:
   - En desarrollo, el proxy de Vite reenvía `/api` → `http://localhost:8080`; no hace falta CORS.
   - Para otra base, define `VITE_API_URL` en `front/.env.local` (p. ej. `VITE_API_URL=http://localhost:9090`).

> `front/mockup/` es material de diseño local y está git-ignorado: nunca se sube.

## Frontend — V1.0.0

F1–F6 están implementadas, junto con el panel por rol de F7. F4.5 cierra la iteración visual y documental: se conserva como estilo de V1.0.0 el diseño oscuro que está actualmente en el código, sin rehacer los flujos anteriores.

- **Clientes:** directorio en filas con nombre, documento, celular, correo y estado. Cada fila abre la ficha independiente `/clients/:id`, con secciones de identidad, membresía, datos, rutinas asignadas, historial y pagos; el tiempo restante de la membresía se representa con una barra de progreso.
- **Inventario:** directorio en tarjetas oscuras con categoría, existencia, mínimo y estado de stock; incluye búsqueda, filtro de stock bajo, resumen de atención, detalle e historial de movimientos.
- **Máquinas:** directorio en tarjetas con marca/modelo, serie y estado; incluye búsqueda, filtro de estado y resumen.
- **Horarios:** malla semanal por entrenador como ledger de una columna (lunes → domingo en pantalla; la API conserva 1 = domingo … 7 = sábado), con bloques editables de hora y estado, días vacíos compactos con alta directa y confirmación antes de reemplazar la semana. `ADMIN` y `TRAINER_MANAGER` editan cualquier malla; un `TRAINER` solo consulta la suya en modo lectura.
- **Rutinas:** catálogo `GENERAL`/`CUSTOM` con filtro y búsqueda, ficha de rutina, alta con validación de tipo/precio/entrenador y asignación a clientes con estados `ACTIVE`, `COMPLETED` y `CANCELLED`.
- **Panel:** `/dashboard` compone una vista distinta por rol (ADMIN, RECEPCIONIST, TRAINER_MANAGER, TRAINER y CLIENT) con tarjetas de indicadores, paneles de trabajo, acciones rápidas y atajos según permisos. Solo usa endpoints existentes; cuando un dato no está disponible lo indica con `—` en lugar de inventarlo.
- **Acciones:** formularios de alta/edición y confirmación antes de eliminar. Eliminar un ítem de inventario también elimina su historial de movimientos.
- **Sistema visual:** superficies oscuras de alto contraste, dorado discreto para marca/acciones, colores semánticos para estados, tarjetas con jerarquía clara y layouts responsive. La especificación vinculante está en **[docs/FRONTEND_BASE.md](docs/FRONTEND_BASE.md)**.
- **Siguiente fase:** F7 (accesibilidad, pruebas de frontend, CI y módulo de usuarios) permanece pendiente; fases y criterios están en **[docs/FRONTEND_PLAN.md](docs/FRONTEND_PLAN.md)**.

## Cuentas sembradas (dev)

| Email | Contraseña | Roles |
|-------|-----------|-------|
| `admin@olimpo.com` | `admin123` | ADMIN |
| `recepcionista@olimpo.com` | `recep123` | RECEPCIONIST |
| `trainer@olimpo.com` | `trainer123` | TRAINER + TRAINER_MANAGER |
| `cliente1@olimpo.com` | `cliente123` | CLIENT (client id = 1) |
| `trainer2@olimpo.com` | `trainer123` | TRAINER |
| `cliente2@olimpo.com` | `cliente123` | CLIENT (client id = 2) |

> Todos los logins con contraseña en claro son datos de prueba; cámbialos en producción.

## Formato de errores

Todo error —incluidos 401 y 500— devuelve un JSON uniforme:

```json
{ "status": 401, "error": "Unauthorized", "message": "Invalid email or password" }
```

Nunca se filtran stacktraces, SQL ni detalles internos; el detalle queda solo en el log del servidor.

## Endpoints

| Módulo | Ruta base | Acciones |
|--------|-----------|----------|
| **Auth** | `/api/v1/auth` | `POST /login`, `POST /refresh`, `GET /me` |
| **Users** | `/api/v1/users` | `POST`, `GET` paginado (solo ADMIN), `GET /{id}`, `PATCH /{id}/roles` |
| **Clients** | `/api/v1/clients` | `POST`, `GET` paginado, `GET /lookup` paginado (selector mínimo), `GET /{id}`, `GET /{id}/memberships` y `/payments` paginados, `GET /{id}/routines` paginado |
| **Trainers** | `/api/v1/trainers` | `GET` paginado (selector mínimo: id, nombre, apellido y especialidad) |
| **Memberships** | `/api/v1/memberships` | `POST`, `GET /active`, `PATCH /{id}/renew` |
| **Payments** | `/api/v1/payments` | `POST`; historial paginado en `/api/v1/clients/{id}/payments` |
| **Inventory** | `/api/v1/inventory/items` | `POST`, `GET` y `/low-stock` paginados, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}` (arrastra sus movimientos), `POST /{id}/movements`, historial paginado en `GET /{id}/movements` |
| **Machines** | `/api/v1/machines` | `POST`, `GET ?status=&search=&page=&size=` paginado, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}` |
| **Schedules** | `/api/v1/trainers/{trainerId}/schedules` | `GET`, `POST` (reemplaza toda la semana) |
| **Routines** | `/api/v1/routines` | `GET ?type=&search=&page=&size=` paginado, `POST`, `GET /{id}`, `POST /{id}/assignments`, `GET /{id}/assignments` paginado |
| | | `GET /api/v1/clients/{clientId}/routines` paginado |

### Carga por tramos y búsqueda

Los endpoints de colecciones aceptan `page` (base cero, por defecto `0`), `size` (por defecto `20`, máximo `100`) y `search` opcional. Responden con `content`, `page`, `size`, `totalElements` y `totalPages`; la búsqueda y el recorte de página se ejecutan en MySQL. Los filtros actuales, como `status` de máquinas y `type` de rutinas, se pueden combinar con esos parámetros.

```http
GET /api/v1/clients?page=0&size=20&search=ana
```

La malla del entrenador conserva una respuesta de lista: está acotada a un plan semanal completo y el `POST` reemplaza ese plan como una unidad.

Ver **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** para la matriz completa de quién puede acceder a cada una y los diagramas de flujo del código.

## Roles y política de acceso

| Rol | Puede |
|-----|-------|
| `ADMIN` | Todo (incluye gestión de usuarios) |
| `RECEPCIONIST` | Clientes, membresías y pagos; consulta rutinas |
| `TRAINER_MANAGER` | Planifica malla horaria, inventario, rutinas; consulta el selector de clientes y entrenadores |
| `TRAINER` | Inventario, su propia malla horaria, crea/asigna rutinas CUSTOM; consulta el selector de clientes (sin datos sensibles) |
| `CLIENT` | Solo lectura de sus propios datos y catálogos (membresía, rutinas) |

## Convenciones del proyecto

- Identificadores del código en **inglés y camelCase** (`trainerId`, `lowStock`, `dayOfWeek`).
- Días de la semana: **1 = domingo … 7 = sábado** (convención MySQL `DAYOFWEEK`).
- Diagrama de flujo completo: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.
- Identidad visual y directivas de estilo del frontend: **[docs/FRONTEND_BASE.md](docs/FRONTEND_BASE.md)**.
- Plan de implementación del frontend (fases, rutas y criterios de aceptación): **[docs/FRONTEND_PLAN.md](docs/FRONTEND_PLAN.md)**.
- Instrucciones para agentes de IA (incluye el rol según carpeta: senior backend en `back/`, senior frontend React en `front/`): **[docs/AGENTS.md](docs/AGENTS.md)**.
- Plan de pruebas para Postman: **[docs/POSTMAN.md](docs/POSTMAN.md)**.

## Pruebas

Suite automatizada en tres fases (orden obligatorio), cada una con su informe `RESULTS.md`:

1. **Unitarias** ✅ — `back/src/test/java/server/olimpo/unit/` — JUnit 5 + Mockito: **99/99 en verde** (ver `unit/RESULTS.md`).
2. **Funcionales** ✅ — `back/src/test/java/server/olimpo/functional/` — contexto real + MySQL por HTTP: **77/77 en verde** (ver `functional/RESULTS.md`).
3. **Volumen** ✅ — `back/src/test/java/server/olimpo/volume/` — concurrencia, cargas y límites: **16/16 en verde** (ver `volume/RESULTS.md`).

**Suite completa: `Tests run: 192, Failures: 0, Errors: 0` → BUILD SUCCESS.** Toda fase purga sus datos al terminar: la BD de desarrollo queda intacta (auditoría SQL en cada `RESULTS.md`).

Además, los 6 sprints se probaron en vivo por API REST (~60 casos). El plan repetible está en **[docs/POSTMAN.md](docs/POSTMAN.md)**.

```powershell
cd back
$env:JAVA_HOME = "C:\Program Files\Java\jdk-27"
.\mvnw.cmd test
```
