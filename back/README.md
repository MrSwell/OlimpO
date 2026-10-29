# 🏛️ Olimpo — Backend

Sistema web de gestión de gimnasio: usuarios con roles, membresías y pagos, inventario con alertas de stock, malla horaria de entrenadores y rutinas de entrenamiento.

> **Header de la API**: todas las rutas responden JSON bajo `/api/v1/**`.

## Stack

| Capa | Tecnología |
|------|------------|
| Java | 27 (`C:\Program Files\Java\jdk-27`) |
| Framework | Spring Boot 4.1.2 (web, security, validation, data-jpa) |
| Seguridad | Spring Security 7 + JWT (jjwt 0.12.6), stateless |
| Datos | MySQL 8 + Hibernate (JavaTimeModule) + Flyway ↓ |
| Migraciones | Flyway (baseline en V5, futuras = V7+) |
| Build | Maven wrapper (`mvnw.cmd`) |

## Estructura del proyecto

```
server.olimpo
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

## Puesta en marcha

1. **MySQL 8** corriendo en `127.0.0.1:3306` con base `olimpo` creada a partir de las migraciones (`src/main/resources/db/migration/V1…V6`).
2. Copia `.env.example` → `.env` y completa credenciales:

   ```properties
   DB_USERNAME=root
   DB_PASSWORD=tu_clave
   JWT_SECRET=al-menos-32-caracteres-aleatorios
   JWT_EXPIRATION_MS=86400000
   SHOW_SQL=true
   ```

3. Arranca:

   ```powershell
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
| **Users** | `/api/v1/users` | `POST`, `GET` (solo ADMIN), `GET /{id}`, `PATCH /{id}/roles` |
| **Clients** | `/api/v1/clients` | `POST`, `GET`, `GET /{id}`, `GET /{id}/memberships`, `GET /{id}/routines` |
| **Memberships** | `/api/v1/memberships` | `POST`, `GET /active`, `PATCH /{id}/renew` |
| **Payments** | `/api/v1/payments` | `POST` |
| **Inventory** | `/api/v1/inventory/items` | `POST`, `GET`, `GET /low-stock`, `GET /{id}`, `PATCH /{id}`, `POST /{id}/movements`, `GET /{id}/movements` |
| **Machines** | `/api/v1/machines` | `POST`, `GET ?status=`, `GET /{id}`, `PATCH /{id}` |
| **Schedules** | `/api/v1/trainers/{trainerId}/schedules` | `GET`, `POST` (reemplaza toda la semana) |
| **Routines** | `/api/v1/routines` | `GET ?type=`, `POST`, `GET /{id}`, `POST /{id}/assignments`, `GET /{id}/assignments` |
| | | `GET /api/v1/clients/{clientId}/routines` |

Ver **[ARCHITECTURE.md](ARCHITECTURE.md)** para la matriz completa de quién puede acceder a cada una.

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
- Diagrama de flujo completo: **[ARCHITECTURE.md](ARCHITECTURE.md)**.
- Instrucciones para otros agentes/IA: **[AGENTS.md](AGENTS.md)**.
- Plan de pruebas para Postman: **[POSTMAN.md](POSTMAN.md)**.

## Pruebas

Se probaron los 6 sprints (auth, usuarios, clientes/membresías/pagos, inventario/máquinas, horarios, rutinas) por API REST viva (~60 casos). Test automatizado no incluido aún (decisión: añadir `JUnit/MockMvc` cuando se solicite).
