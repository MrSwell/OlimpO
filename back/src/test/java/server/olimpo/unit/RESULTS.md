# Fase 1 — Pruebas unitarias · Resultados

- **Fecha de ejecución:** 2026-10-29
- **Comando:** `$env:JAVA_HOME = "C:\Program Files\Java\jdk-27"; .\mvnw.cmd test`
- **Stack:** JUnit 5 + Mockito (sin contexto Spring — puros mocks vía `@ExtendWith(MockitoExtension.class)`)
- **Resultado global:** `Tests run: 89, Failures: 0, Errors: 0, Skipped: 0` → **BUILD SUCCESS**

## Cobertura por clase

| # | Clase | Módulo (sprint) | Pruebas | Ok | Fallas |
|---|-------|-----------------|---------|----|--------|
| 1 | `SmokeTest` | Toolchain | 1 | 1 ✅ | 0 |
| 2 | `JwtServiceTest` | S1 Auth | 3 | 3 ✅ | 0 |
| 3 | `AuthServiceTest` | S1 Auth | 4 | 4 ✅ | 0 |
| 4 | `UserServiceTest` | S2 Usuarios/RBAC | 10 | 10 ✅ | 0 |
| 5 | `ClientServiceTest` | S3 Clientes | 11 | 11 ✅ | 0 |
| 6 | `MembershipServiceTest` | S3 Membresías | 15 | 15 ✅ | 0 |
| 7 | `PaymentServiceTest` | S3 Pagos | 4 | 4 ✅ | 0 |
| 8 | `InventoryServiceTest` | S4 Inventario | 10 | 10 ✅ | 0 |
| 9 | `MachineServiceTest` | S4 Máquinas | 7 | 7 ✅ | 0 |
| 10 | `TrainerScheduleServiceTest` | S5 Horarios | 10 | 10 ✅ | 0 |
| 11 | `RoutineServiceTest` | S6 Rutinas | 13 | 13 ✅ | 0 |
| 12 | `OlimpoApplicationTests` | Contexto real (MySQL) | 1 | 1 ✅ | 0 |
| | **Total** | | **89** | **89** | **0** |

## Qué se valida en esta fase

- **Auth (S1):** round-trip del JWT (generar/parsear), rechazo de tokens corruptos y de otra clave/firma (`isValid=false` sin excepciones), normalización de email en login (`trim + lowercase`), `login`/`refresh`/`me` con roles y `tokenType=Bearer`.
- **Usuarios (S2):** contraseña hasheada con BCrypt antes de persistir, email duplicado → `BusinessException` (409), rol `CLIENT` rechazado en gestión de usuarios (400), rol inválido y roles duplicados → 400, **guard anti-escalamiento: solo ADMIN puede asignar rol `ADMIN`** (no-ADMIN → `AccessDeniedException` 403), auto-creación del perfil `trainers` al asignar rol `TRAINER`, `updateUserRoles` atómico (`deleteUserRoles` → `insertUserRole` en orden, verificado con `InOrder`), listado con roles agrupados por proyección.
- **Clientes (S3):** creación de usuario + perfil + rol CLIENT, normalización de email y sexo (`f → F`), duplicado → 409, sexo inválido → 400, 404 en cliente desconocido, y la matriz de acceso: staff (ADMIN/RECEPCIONIST) ve cualquier cliente, `CLIENT` solo el propio (403 `Clients can only access their own data`).
- **Membresías (S3):** duraciones por tipo (**DAILY=1, QUARTERLY=15, MONTHLY=30** días), máx. 1 `ACTIVE` → 409, tipos/métodos/precios inválidos → 400 con listas permitidas, `renew` extiende desde `max(fechaFin, hoy)` y registra `Payment`, `renew` de membresía no-ACTIVE → 409, `/active` propio para CLIENT vs. parametrizado para staff.
- **Pagos (S3):** vinculación membership→client, método normalizado a mayúsculas, monto ≤ 0 → 400, membresía desconocida → 404 (validación de orden: 404 antes que 400).
- **Inventario (S4):** defaults `quantity=0 / minStock=5` con `lowStock=true`, negativos → 400, `INBOUND` suma y `OUTBOUND` resta stock, `OUTBOUND` sobre stock → 409 `Insufficient stock` **sin** tocar el `save` del movimiento, tipo inválido → 400 con `INBOUND, OUTBOUND`, recálculo de alerta al actualizar.
- **Máquinas (S4):** `status` default `AVAILABLE`, serial duplicado → 409 (create y update contra otro id), estados inválidos → 400, 404 para id inexistente.
- **Horarios (S5):** `POST` **reemplaza la semana completa** (`deleteAll` verificado con la lista vieja), conversión `dayOfWeek` → `dayName` (2→Monday, 7→Saturday), solapamientos → 409 **sin** tocar el repositorio (`verifyNoInteractions`), `end ≤ start` → 400, estados → 400, TRAINER ajeno → 403 con mensaje propio, CLIENT/RECEPCIONIST → 403, TRAINER_MANAGER con acceso total.
- **Rutinas (S6):** `GENERAL` con `trainerId/price = null`, `GENERAL` con precio → 400, `CUSTOM` sin precio → 400, TRAINER siempre usa su propio perfil ignorando `trainerId` de la petición, TRAINER sin perfil → 404, asignación por defecto `ACTIVE` con fecha de hoy, cliente/rutina desconocidos → 400/404, `CLIENT` sin acceso de gestión → 403.

## Estado de la base de datos tras la fase 🧹

- **Ningún registro creado ni eliminado:** las unitarias usan mocks de repositorio — la BD `olimpo` queda **exactamente igual** que antes de la fase (0 filas afectadas).
- Verificado: `OlimpoApplicationTests` solo levanta el contexto (Flyway baseline V5 + V6 ya aplicados); no inserta datos.
- La verificación de `DELETE`/limpieza real queda para la **Fase 2 (funcionales)**, que sí escribe en MySQL.

## Hallazgos corregidos durante la fase

1. `AuthenticationManager.authenticate()` no es `void` → `doNothing()` lanzó `MockitoException` en `AuthServiceTest`; se reemplazó por `when(...).thenReturn(authentication)`.
2. `UserService.getAllUsers` firma real `(String search, Pageable) → PageResponse<UserResponse>` (no `List`); el test se adaptó a `searchUsers` + proyección `UserRoleNameProjection`.

## Nota

- Advertencia benigna de Mockito (*self-attach*): documentada en `AGENTS.md`; si el JDK futuro lo bloquea, registrar Mockito como java agent en el plugin de Surefire.