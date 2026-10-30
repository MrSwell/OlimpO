# Fase 3 — Pruebas de volumen · Resultados

- **Fecha de ejecución:** 2026-10-29
- **Comando:** `$env:JAVA_HOME = "C:\Program Files\Java\jdk-27"; .\mvnw.cmd test`
- **Stack:** JUnit 5 + `BaseVolumeTest` (hereda toda la pila funcional: app real en `RANDOM_PORT` + `HttpClient`) con helpers de concurrencia: `runParallel(threads, operación)` suelta todos los hilos a la vez con `CyclicBarrier` y exige **cero 5xx** en cada corrida.
- **Resultado global de la suite:** `Tests run: 180, Failures: 0, Errors: 0, Skipped: 0` → **BUILD SUCCESS**
  - Fase de volumen (esta fase): **16 pruebas**
  - Fase funcional: 77 · Fase unit + contexto: 87 (ver sus `RESULTS.md`)

## Cobertura por clase

| # | Clase | Enfoque | Pruebas | Ok | Fallas |
|---|-------|---------|---------|----|--------|
| 1 | `LoginLoadTest` | Carga de autenticación | 4 | 4 ✅ | 0 |
| 2 | `BulkDataVolumeTest` | Volumen de datos + paginación | 5 | 5 ✅ | 0 |
| 3 | `ConcurrencyIntegrityTest` | Integridad bajo carrera | 4 | 4 ✅ | 0 |
| 4 | `ScheduleReplaceStressTest` | Estrés de reemplazo semanal | 3 | 3 ✅ | 0 |
| | **Total fase volumen** | | **16** | **16** | **0** |

## Qué se somete a volumen y qué demuestra

### `LoginLoadTest` — autenticación bajo carga
| Test | Volumen | Aserción |
|------|---------|----------|
| V1 | **160 logins concurrentes** (5 rondas × 32 hilos, 5 cuentas sembradas) + 40 `/auth/me` en paralelo | todos 200, los 160 tokens emitidos autentican |
| V2 | **60 logins con credencial mala** en paralelo | 60 × 401 con mensaje genérico idéntico |
| V3 | **36 `/auth/refresh`** concurrentes con tokens válidos | 36 × 200 con JWT real |
| V4 | **40 `/auth/me` sin token** en paralelo | 40 × 401 con JSON unificado |

En los 4 tests: `assertNo5xx` — bajo carga la API degrada siempre con 4xx unificado, jamás 500.

### `BulkDataVolumeTest` — volumen de datos y paginación
| Test | Volumen | Aserción |
|------|---------|----------|
| V1 | **40 clientes** creados por API + caminata paginada (`size=10`, 4 páginas) | `totalElements` **estable** en cada página, cada email leído **exactamente una vez**; `search=func.test` ve exactamente 40 |
| V2 | **10 altas de membresía** sobre 1 cliente | exactamente **1 × 201 y 9 × 409**; `/active` devuelve la única `ACTIVE` |
| V3 | Límites: descripción **2000 / 2001** chars, firstName **100 / 101** chars, `size=101`, `page=-1` | 201/100 exactos en el borde permitido; 400 en el que lo excede |
| V4 | **15 usuarios** + caminata `/users?size=5` (3 páginas) | `search` = 15 exactos, caminata = conjunto idéntico (sin duplicados ni pérdidas) |
| V5 | **100 movimientos** (50 × INBOUND 2 + 50 × OUTBOUND 1) | cantidad final **50**, historial con `totalElements = 100` |

Cada test termina con `purgeLeftovers()` + `assertEquals(0, countLeftovers())` (la purga FK completa: pagos → membresías → clientes → trainers → usuarios, rutinas, movimientos → ítems, máquinas).

### `ConcurrencyIntegrityTest` — integridad bajo carrera real
| Test | Carrera | Aserción |
|------|---------|----------|
| V1 | **8 hilos** creando membresía **al mismo cliente** | **1 × 201 + 7 × 409**; en BD exactamente **1 fila ACTIVE** (índice único `(client_id, status)`) |
| V2 | **6 hilos** creando usuario con **el mismo email** | **1 × 201 + 5 × 409**; en BD **1 fila** (UNIQUE email) |
| V3 | **Overdraw**: ítem con 10 unidades, **10 hilos** sacan 5 | **2 × 201 + 8 × 409 "Insufficient stock"**; stock final **0** (nunca negativo) y `lowStock=true` — ejercita el `SELECT … FOR UPDATE` de `findByIdForUpdate` |
| V4 | **10 asignaciones** de rutina en paralelo | sin 5xx; solo 201/409 |

### `ScheduleReplaceStressTest` — estrés del reemplazo semanal
| Test | Volumen | Aserción |
|------|---------|----------|
| V1 | **15 reemplazos seguidos** de una semana de **14 slots** (7 días × 2) | cada respuesta y el GET final traen exactamente **14 slots** (sin duplicar ni perder), 2 de lunes; < 20 s (loose) |
| V2 | **5 repost idénticos** de la misma semana | 14 slots en API **y en BD** (reemplazo no duplica) |
| V3 | **16 hilos** leyendo la semana con reemplazos intercalados (4 escritores) | todos 200, todos con 14 slots, **cero 5xx** |

El `@BeforeEach` respalda la semana del trainer 1 y el `@AfterEach` la restaura: la malla sembrada queda intacta.

## Hallazgo real corregido durante la fase 🔧

**Bug detectado por V3 de `ScheduleReplaceStressTest`:** dos `POST /trainers/{id}/schedules` simultáneos leían la misma semana vieja; el `deleteAll` del segundo borraba filas ya eliminadas por el primero → `ObjectOptimisticLockingFailureException` (`StaleObjectStateException`) → **HTTP 500**.

Corrección en dos niveles:
1. **Causa raíz** — `TrainerRepository.findByIdForUpdate` con `@Lock(PESSIMISTIC_WRITE)` y uso en `TrainerScheduleService.saveWeeklySchedule`: los reemplazos del mismo trainer se serializan sobre la fila `trainers` (`SELECT … FOR UPDATE`), por lo que ya no pueden pisarse.
2. **Red de seguridad** — `GlobalExceptionHandler` ahora tiene handler de `OptimisticLockingFailureException` → **409** con mensaje genérico (`"The request conflicts…"`): ninguna carrera futura podrá convertirse en 500.
3. `TrainerScheduleServiceTest` (unit) adaptado a los stubs `findByIdForUpdate` en los 6 tests de escritura.

## Verificación de limpieza (los deletes) 🧹

Al terminar la suite completa, **auditoría en vivo contra MySQL**:

| Consulta | Resultado |
|----------|-----------|
| `users` `email LIKE 'func.test%'` | **0** |
| `memberships` de clientes `func.test%` | **0** |
| `payments` `reference IN ('REF-VOL','REF-RACE')` | **0** |
| `routines` `LIKE 'FUNC TEST routine%'` | **0** |
| `inventory_items` `LIKE 'FUNC TEST item%'` | **0** |
| `machines` `LIKE 'FUNC-SERIAL%'` | **0** |
| **Totales:** `users` / `memberships` | **12 / 5** (idénticos a antes de la fase) |
| `trainer_schedules` trainer 1 (respaldada y restaurada) | **0** (igual que antes) |
| `trainer_schedules` trainer 2 (sembrado) | **2** — intacto |

Además, cada uno de los 16 tests ejecuta su propia purga + aserción `0 leftovers`, y la base de `BaseFunctionalTest` reintenta `@BeforeAll` de cada clase por si una corrida anterior quedó a medias.

## Notas

- Los 5 tests de volumen de escritura destruyen y reconstruyen filas en tablas **sin** datos sembrados sensibles; los únicos datos Seeds que se reescriben (horarios del trainer 1) van respaldados y restaurados.
- Pendiente del equipo: 6 cuentas de las **pruebas manuales previas** a las fases (`clientetest*`, `testuser*`, usuarios 7–12 + sus 4 membresías/perfiles) siguen en la BD; ninguna fase automatizada las tocó.