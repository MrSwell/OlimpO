# AGENTS.md — Guide for AI agents working in the Olimpo repository

Read this before modifying code in this repository. It encodes decisions already taken by the team; follow them instead of re-deciding.

## 0. Agent role routing (folder-based persona)

Work at senior engineering level, and adopt the persona matching the folder you are touching:

| Folder | Persona | Focus |
|--------|---------|-------|
| `back/` | **Senior Backend Engineer** | Java 27, Spring Boot 4, Spring Security, JPA/MySQL, RBAC, API design. See §2–§7. |
| `front/` (when it exists) | **Senior Frontend Engineer & Web Architect (React)** | React SPA consuming `/api/v1`, component architecture, state/auth handling with the JWT from login, API contract fidelity with the backend DTOs. Must not change the API contract — propose backend changes via the backend persona instead. |
| `docs/`, root | Documentation engineer | Keep the .md guides truthful: endpoints, codes, conventions. |

Global rules for every persona: code identifiers in **English** (camelCase for TS/JS, camelCase for Java; filenames kebab-case for React components is acceptable), conversation with the user in **Spanish**, no secrets in committed files, always keep the unified error JSON shape when touching any client that renders errors.

## 1. Project snapshot

- **Product**: gym management system "Olimpo". Monorepo layout: backend = `back/` (this guide's detail), documentation = `docs/`, frontend React = `front/` (planned).
- **Backend stack**: Java 27, Spring Boot 4.1.2, Spring Security 7 (stateless JWT via jjwt 0.12.6), Spring Data JPA, MySQL 8, Flyway, Lombok, Maven wrapper (`mvnw.cmd`), Windows + PowerShell 5.1.
- **Base package**: `server.olimpo` (NOT `com.olimpo.gym`).
- **DB name**: `olimpo`, 13 tables, schema fully managed by Flyway migrations V1–V6.

## 2. Non-negotiable conventions

1. **All code identifiers in English, camelCase** (`trainerId`, `lowStock`, `dayOfWeek`, `yearOfExperience`). Conversation with the user is in Spanish; code/comments in English.
2. **Tests live in three ordered phases** under `back/src/test/java/server/olimpo/`: `unit/` (JUnit + Mockito, no Spring context) → later `functional/` (real context + MySQL) → later `volume/`. Each test folder contains a `RESULTS.md` report. Keep the existing style (Mockito `@Mock` repos with `thenAnswer` to set entity ids, `@DisplayName` in English). Every phase must end verifying delete/cleanup so the dev DB isn't polluted.
3. **Never print stack traces, SQL or class details in HTTP error responses.** `GlobalExceptionHandler` must remain the single place that maps exceptions to responses with this exact shape:
   ```json
   { "status": 400, "error": "Bad Request", "message": "..." }
   ```
4. **Passwords** are BCrypt-hashed, never serialized in responses (`passwordHash` is excluded from all `*Response` records).
5. **Default response statuses**: 201 on create, 200 elsewhere; errors per §4 of `ARCHITECTURE.md`.
6. Allowed roles: `ADMIN`, `RECEPCIONIST`, `TRAINER_MANAGER`, `TRAINER`, `CLIENT`. Roles map natively (no Role entity): authorities are `ROLE_<NAME>` via `UserDetailsServiceImpl`. Do not switch to enum-based role ids (causes TINYINT id validation errors).

## 3. Critical business rules (already implemented)

- **Users**: every role except `CLIENT` may create users (`POST /api/v1/users`). Assigning role `CLIENT` via user management is forbidden (400) — clients are created through `/api/v1/clients` (which creates both the user and the client profile). Assigning role `ADMIN` is allowed only when the caller itself is ADMIN (403 otherwise) — no privilege escalation.
- **Trainer profiles**: a `trainers` row is auto-created when role `TRAINER` is assigned (`UserService.ensureTrainerProfile`). Schedules/routines fail with 404 if the user has `TRAINER` role but no profile.
- **Memberships are history**: index `(client_id, status)` enforces max 1 `ACTIVE` per client (409 otherwise). Durations: DAILY=1 day, QUARTERLY=15, MONTHLY=30. Renew extends `end_date` from `max(endDate, today)` and auto-registers a payment.
- **Inventory**: access roles are ADMIN, TRAINER_MANAGER, TRAINER — **deliberately NOT RECEPCIONIST** ("a veces no está la recepcionista"). `OUTBOUND` rejects quantity > stock (409). Valid statuses: `AVAILABLE`, `MAINTENANCE`, `OUT_OF_SERVICE` (400 otherwise). Serial numbers unique (409).
- **Schedules**: `POST` replaces the trainer's whole weekly plan. `day_of_week` is TINYINT with MySQL `DAYOFWEEK` convention: **1 = Sunday … 7 = Saturday**. Java conversion to name uses `DayOfWeek.of((dayOfWeek + 5) % 7 + 1)`. Overlapping slots on the same day → 409. `end_time > start_time`, `status ∈ {AVAILABLE, NOT_AVAILABLE, RESERVED}`.
- **Routines**: `GENERAL` → trainer NULL and price must be null; `CUSTOM` → price > 0 mandatory and trainer required (implicit own-profile for TRAINER role, explicit `trainerId` for ADMIN/TRAINER_MANAGER). Assignment statuses: `ACTIVE`, `COMPLETED`, `CANCELLED`.
- **Schedule access**: ADMIN/TRAINER_MANAGER manage any trainer's schedule; a plain TRAINER only their own (403 otherwise). Multi-role users (e.g. TRAINER+TRAINER_MANAGER) get the manager abilities.

## 4. Database notes

- Flyway runs with `baseline-on-migrate=true`, `baseline-version=5`; migrations V1–V6 are recorded. **New migrations must be V7+** in `src/main/resources/db/migration/` following naming `V7__description_of_change.sql`.
- Hibernate runs `ddl-auto=validate`: if you introduce a column type Hibernate can't infer (e.g. TINYINT), annotate with `@JdbcTypeCode(SqlTypes.TINYINT)` as done in `TrainerSchedule.dayOfWeek`.
- All native queries must use `:namedParams` (SQL-injection safe by binding); never concatenate user input into SQL.
- Connection string, credentials, `SHOW_SQL` and JWT config all come from `.env` (loaded via `spring.config.import=optional:file:.env[.properties]`). `.env` must never be committed; `.env.example` shows the shape.

## 5. Environment & build gotchas (Windows)

- Always set `JAVA_HOME` before invoking Maven:
  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Java\jdk-27"
  .\mvnw.cmd compile         # hot-reload via devtools
  .\mvnw.cmd spring-boot:run # start (background recommended)
  ```
- **PowerShell 5.1 sends `-Body` strings as Latin-1.** To avoid `Invalid UTF-8 middle byte` JSON errors, always send UTF-8 byte arrays:
  ```powershell
  Invoke-RestMethod -Uri $uri -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($json))
  ```
- Do not chain shell commands with `;`+echo separators (noisy); PS 5.1 has no `grep`/bash loops.
- Avoid raw `< file` redirection; use `Get-Content`.
- `run.log` in the project root may be locked by orphaned `java.exe` processes (old `spring-boot:run` runs). Before killing strays, match command line for `olimpo|spring-boot` — and be careful not to kill the VS Code language server (`redhat.java`).
- Known harness quirk: reading 401 response bodies through `Invoke-RestMethod` may show them empty; use `curl.exe -s -i` to inspect raw responses.

## 6. Seeded dev accounts

| email | password | roles |
|-------|----------|-------|
| admin@olimpo.com | admin123 | ADMIN |
| recepcionista@olimpo.com | recep123 | RECEPCIONIST |
| trainer@olimpo.com | trainer123 | TRAINER + TRAINER_MANAGER (trainer id 2) |
| trainer2@olimpo.com | trainer123 | TRAINER (trainer id 1) |
| cliente1@olimpo.com | cliente123 | CLIENT (client id 1) |
| cliente2@olimpo.com | cliente123 | CLIENT (client id 2) |

Existing data: 1 inventory item (id 1), 2 machines, 3 routines, 2 schedule sets, 2 client profiles.

## 7. How to add a new feature (recipe)

1. Migration in Flyway (V7+) if schema changes.
2. New enum(s) under `enums/` if there are closed value sets (always validate via `valueOf` + friendly `IllegalArgumentException`).
3. Entity under `entity/` (Lombok `@Getter/@Setter/@Builder/@NoArgsConstructor/@AllArgsConstructor`, `GenerationType.IDENTITY`, `updatable = false` + `@CreationTimestamp` for created dates).
4. Repository under `repository/` (derived queries or JPQL; prefer JPQL `@Query` when the parsed-name approach is ambiguous — see `InventoryItemRepository.findLowStockItems`).
5. Request/response records under `dto/request` & `dto/response` with jakarta validation annotations sized to match column limits.
6. Service with business rules, throwing `BusinessException` (→409), `ResourceNotFoundException` (→404), `IllegalArgumentException` (→400), or Spring's `AccessDeniedException` (→403).
7. Controller with `@PreAuthorize` at class or method level, returning DTOs (never entities).
8. Compile, let devtools restart, verify live with UTF-8 JSON requests; update the endpoint tables in `README.md`/`docs/ARCHITECTURE.md` and the test plan in `docs/POSTMAN.md`.

## 8. Current state (last verified 2026-10-29)

- All 6 planned sprints complete and live-tested (~60 cases, all green): auth JWT, users/roles RBAC, clients/memberships/payments, inventory/machines, weekly schedules, routines/assignments.
- Security hardening applied: unified error JSON, env-based secrets, stricter DTO validation, catch-all 500 without internals.
- Git: pushed to `origin = https://github.com/MrSwell/OlimpO.git` (branch `master`).
- Tests: all 3 phases done — unit 89 + functional 77 + volume 16 = **182/182 green**, whole suite `.\mvnw.cmd test` in ~1 min (each folder has its `RESULTS.md`). Volume phase caught & fixed a real bug: concurrent weekly-schedule replaces raced into a 500 (now serialized via `TrainerRepository.findByIdForUpdate` + `OptimisticLockingFailureException` → 409 handler). Security review hardened: only ADMIN may assign the ADMIN role on `POST /users`; concurrent membership renews serialized (`MembershipRepository.findByIdForUpdate`); disabled users can't ride an old JWT (filter checks `isEnabled`); `UsernameNotFoundException` → 401 (never 500).
- Still open: rate-limiting for `/auth/login`, CORS config when frontend arrives, frontend (`front/`) not started.
