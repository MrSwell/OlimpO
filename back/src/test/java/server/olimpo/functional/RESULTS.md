# Fase 2 — Pruebas funcionales · Resultados

- **Fecha de ejecución:** 2026-10-29
- **Comando:** `$env:JAVA_HOME = "C:\Program Files\Java\jdk-27"; .\mvnw.cmd test`
- **Stack:** JUnit 5 + contexto Spring completo (`@SpringBootTest(webEnvironment = RANDOM_PORT)`) contra el **MySQL local real**, hablando HTTP por `java.net.http.HttpClient` (Spring Boot 4 eliminó `TestRestTemplate`).
- **Resultado global de la suite:** `Tests run: 164, Failures: 0, Errors: 0, Skipped: 0` → **BUILD SUCCESS**
  - Fase funcional (esta fase): **77 pruebas**
  - Fase unit + contexto: 87 (ver `../unit/RESULTS.md`)

## Arquitectura de la fase

- `BaseFunctionalTest` (base abstracta de todas las clases):
  - Arranca la app completa (seguridad JWT + MVC + JPA + Flyway) en un puerto aleatorio — nunca toca el :8080 del server de desarrollo.
  - Helpers HTTP (`get/post/patch/put`) con header `Authorization: Bearer` y JSON UTF-8; parseo con JsonPath; `assertError(...)` valida el **JSON de error unificado** `{status, error, message}` y niega fugas (`at server.olimpo`, `passwordHash`, `.java:`).
  - **Contrato de limpieza**: todo dato de prueba usa prefijos (`func.test…` en emails, `FUNC TEST …` en nombres, `FUNC-SERIAL…` en seriales). `purgeLeftovers()` borra en orden FK (pagos → membresías → clientes → trainers → usuarios; rutinas; movimientos → ítems; máquinas) **antes de cada clase** y **después de CADA test**, y el `@AfterEach` común **falla el test si quedó alguna fila** (el delete está verificado automáticamente ×77).
  - Los horarios de `trainer id 1` se respaldan (`@BeforeEach`) y restauran (`@AfterEach`) porque el `POST` **reemplaza toda la semana**.

## Cobertura por clase

| # | Clase | Módulo | Pruebas | Ok | Fallas |
|---|-------|--------|---------|----|--------|
| 1 | `AuthFunctionalTest` | A — Autenticación | 7 | 7 ✅ | 0 |
| 2 | `UserFunctionalTest` | B — Usuarios/RBAC | 9 | 9 ✅ | 0 |
| 3 | `ClientMembershipFunctionalTest` | C — Clientes/Membresías/Pagos | 15 | 15 ✅ | 0 |
| 4 | `InventoryFunctionalTest` | D — Inventario | 11 | 11 ✅ | 0 |
| 5 | `MachineFunctionalTest` | E — Máquinas | 8 | 8 ✅ | 0 |
| 6 | `ScheduleFunctionalTest` | E — Malla horaria | 10 | 10 ✅ | 0 |
| 7 | `RoutineFunctionalTest` | F — Rutinas/Asignaciones | 10 | 10 ✅ | 0 |
| 8 | `ErrorShapeFunctionalTest` | G — Forma de errores | 7 | 7 ✅ | 0 |
| | **Total fase funcional** | | **77** | **77** | **0** |

## Qué se valida de punta a punta (over real HTTP + MySQL real)

- **Auth:** login JWT con roles/`tokenType`/`expiresIn`, credenciales malas → 401 genérico, `/me` con/sin token, `/refresh`, normalización del email a minúsculas, token corrupto → 401 (nunca 500).
- **Usuarios:** creación 201 sin eco de contraseña en la respuesta, email duplicado → 409, rol `CLIENT` y rol inválido → 400 con mensajes concretos, `GET` solo ADMIN (RECEPCIONIST → 403), `PATCH roles` reemplaza el set completo, 404 en id inexistente.
- **Clientes/membresías/pagos:** registro crea usuario+perfil+rol CLIENT (201), lectura propia vs. ajena (403), **MONTHLY = hoy+30 y DAILY = hoy+1** verificados por fecha exacta, segunda `ACTIVE` → 409, tipos/métodos inválidos → 400 con listas permitidas, renombrado de `renew` +15 días desde `endDate`, pagos 201/400/404, `/active` resuelto por rol (staff parametrizado, CLIENT propio), resto de matriz 403.
- **Inventario:** defaults `quantity=0/minStock=5/lowStock=true`, `INBOUND` limpia la alerta, `OUTBOUND` sobre stock → 409 **sin cambiar la BD**, tipo inválido → 400, `/low-stock`, PATCH recalcula alerta, historial de movimientos, **RECEPCIONIST → 403 (regla de producto)**, TRAINER sí 201, 404s.
- **Máquinas:** `AVAILABLE` por defecto, serial duplicado → 409, PATCH a `MAINTENANCE` + filtro `?status=`, estados inválidos en create/patch/filtro → 400, TRAINER 201, RECEPCIONIST 403, 404.
- **Horarios:** reemplazo semanal completo con `dayName` correcto (2→Monday, 7→Saturday), solapamiento → 409 **sin alterar la semana guardada**, `dayOfWeek` fuera de rango → 400 (validación Bean en la ruta), `end ≤ start` → 400, estado inválido → 400, TRAINER propio vs. ajeno (403), MANAGER sí, CLIENT/RECEPCIONIST 403, trainer inexistente 404, semana vacía 400. **La malla del trainer 1 se restaura tras cada test.**
- **Rutinas:** catálogo público autenticado, `GENERAL` con `trainerId/price` null reales en JSON, precio en GENERAL y tipo inválido → 400, `CUSTOM` por ADMIN con `trainerId=2` resuelve `trainerName`, `CUSTOM` sin precio → 400, CLIENT → 403, asignación 201 `ACTIVE` con fecha de hoy y nombres resueltos, cliente/rutina desconocidos 404, estado inválido → 400, historial, cliente propio vs. ajeno (403).
- **Errores:** comprobación cruzada del contrato único en 401/404/405/400 de validación/tipo/malformed JSON y verificación de que ninguna respuesta contiene SQL, FQCN internos ni `passwordHash`.

## Verificación de limpieza (los deletes) 🧹

1. **Automática (×77):** cada test termina con `verifyDatabaseIsClean()` → purga y `assertEquals(0, countLeftovers())`. Todo en verde ⇒ ninguna fila `func*` sobrevivió a ningún test.
2. **Auditoría en vivo contra MySQL al terminar la suite:**

| Consulta | Resultado |
|----------|-----------|
| `users` con `email LIKE 'func.test%'` | **0** |
| `memberships` de clientes `func.test%` | **0** |
| `payments` con referencias `REF-FUNC/RENEW/PAY` | **0** |
| `routines` `LIKE 'FUNC TEST routine%'` | **0** |
| `inventory_items` `LIKE 'FUNC TEST item%'` | **0** |
| `machines` `LIKE 'FUNC-SERIAL%'` | **0** |
| `trainer_schedules` del trainer 1 (respaldadas y restauradas) | **0** (igual que antes de la fase) |
| `trainer_schedules` del trainer 2 (seeded, intacto) | **2** |

3. **Estado del resto de la BD:** intacto — solo existen los 6 usuarios sembrados + 6 cuentas de las **pruebas manuales anteriores a esta fase** (`clientetest…`, `testuser…`, usuarios 7-12) y sus perfiles/membresías, que esta fase no tocó (pendiente de decisión del equipo si se depuran).

## Hallazgos corregidos durante la fase

1. Spring Boot 4.1.2 **no tiene `TestRestTemplate`** → se usó `java.net.http.HttpClient` (JDK) y el parseo con JsonPath (test-scoped).
2. `@Email` rechaza el email con espacios **antes** de que el servicio normalice → A6 usa solo caja mixta (el trim queda cubierto en la unit `AuthServiceTest`).
3. `documentNumber` tiene `@Size(max=20)` → helper `uniqueDocument()` (`D` + 9 dígitos + contador).
4. Helper `createClient` declarado con tipo de retorno incorrecto (`String` → `Response`).

## Nota

- Warning menor de Bean Validation: `@Valid` sobre `List` en `TrainerScheduleController#saveWeeklySchedule` (deprecado, aplica igual la validación por elemento). Candidato a moverse al elemento del tipo cuando se toque ese controlador.