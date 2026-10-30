# 🏛️ Olimpo — Sistema de gestión de gimnasio

Monorepo del sistema web de gestión de gimnasio: usuarios con roles, membresías y pagos, inventario con alertas de stock, malla horaria de entrenadores y rutinas de entrenamiento.

## Estructura del repositorio

```
OlimpO/
├── back/      # Backend Spring Boot 4 (Java 27 + MySQL 8) — API /api/v1
├── docs/      # Documentación técnica y planes de prueba
│   ├── ARCHITECTURE.md   # Diagramas de flujo, módulos, acceso por ruta
│   └── POSTMAN.md        # Plan de pruebas (~90 casos) para la IA de Postman
├── front/     # Futuro frontend (React) — por crear
└── AGENTS.md  # Convenciones y persona del agente según carpeta
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
| **Clients** | `/api/v1/clients` | `POST`, `GET` paginado, `GET /{id}`, `GET /{id}/memberships` y `/payments` paginados, `GET /{id}/routines` paginado |
| **Memberships** | `/api/v1/memberships` | `POST`, `GET /active`, `PATCH /{id}/renew` |
| **Payments** | `/api/v1/payments` | `POST`; historial paginado en `/api/v1/clients/{id}/payments` |
| **Inventory** | `/api/v1/inventory/items` | `POST`, `GET` y `/low-stock` paginados, `GET /{id}`, `PATCH /{id}`, `POST /{id}/movements`, historial paginado en `GET /{id}/movements` |
| **Machines** | `/api/v1/machines` | `POST`, `GET ?status=&search=&page=&size=` paginado, `GET /{id}`, `PATCH /{id}` |
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
| `TRAINER_MANAGER` | Planifica malla horaria, inventario, rutinas |
| `TRAINER` | Inventario, su propia malla horaria, crea/asigna rutinas CUSTOM |
| `CLIENT` | Solo lectura de sus propios datos y catálogos (membresía, rutinas) |

## Convenciones del proyecto

- Identificadores del código en **inglés y camelCase** (`trainerId`, `lowStock`, `dayOfWeek`).
- Días de la semana: **1 = domingo … 7 = sábado** (convención MySQL `DAYOFWEEK`).
- Diagrama de flujo completo: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.
- Instrucciones para agentes de IA (incluye el rol según carpeta: senior backend en `back/`, senior frontend React en `front/`): **[AGENTS.md](AGENTS.md)**.
- Plan de pruebas para Postman: **[docs/POSTMAN.md](docs/POSTMAN.md)**.

## Pruebas

Suite automatizada en tres fases (orden obligatorio), cada una con su informe `RESULTS.md`:

1. **Unitarias** ✅ — `back/src/test/java/server/olimpo/unit/` — JUnit 5 + Mockito: **87/87 en verde** (ver `unit/RESULTS.md`).
2. **Funcionales** — contra contexto real + MySQL (pendiente).
3. **Volumen** — (pendiente).

Además, los 6 sprints se probaron en vivo por API REST (~60 casos). El plan repetible está en **[docs/POSTMAN.md](docs/POSTMAN.md)**.

```powershell
cd back
$env:JAVA_HOME = "C:\Program Files\Java\jdk-27"
.\mvnw.cmd test
```
