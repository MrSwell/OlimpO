# POSTMAN.md — API testing plan for Postman (human or AI agent)

Target: the Olimpo backend running locally http://localhost:8080.

## 0. Setup rules

1. **Base URL**: `{{baseUrl}} = http://localhost:8080`. All routes start with `/api/v1`.
2. **Login first**, then reuse the token:
   - `POST {{baseUrl}}/api/v1/auth/login` with body `{"email":"admin@olimpo.com","password":"admin123"}`
   - Save `token` into a collection variable and send every request with header `Authorization: Bearer {{token}}`.
3. Content-Type for every request with a body: `application/json; charset=utf-8`.
4. Requests are **sent sequentially** in the order below, because later steps depend on ids created earlier (capture `.id` from responses into variables).
5. Error format is always the same JSON shape: `{"status","error","message"}` — assert on it when testing error paths. Do NOT assert on stack traces/nested internals (never present by design).
6. Collection endpoints use `page` (zero-based, default `0`), `size` (default `20`, maximum `100`) and optional `search`; successful responses have `content`, `page`, `size`, `totalElements` and `totalPages`. Existing filters such as `status` and `type` can be combined with pagination. Search runs in the database before the page is fetched.

## 1. Seeded accounts

| email | password | roles |
|-------|----------|-------|
| admin@olimpo.com | admin123 | ADMIN |
| recepcionista@olimpo.com | recep123 | RECEPCIONIST |
| trainer@olimpo.com | trainer123 | TRAINER_MANAGER + TRAINER (trainer id 2) |
| trainer2@olimpo.com | trainer123 | TRAINER (trainer id 1) |
| cliente1@olimpo.com | cliente123 | CLIENT (client id 1) |
| cliente2@olimpo.com | cliente123 | CLIENT (client id 2) |

## 2. Test suite

### Module A — Auth
| # | Request | Body | Expect |
|---|---------|------|--------|
| A1 | POST /auth/login | admin creds | 200, response has `token`, `roles`, `tokenType=Bearer` |
| A2 | POST /auth/login | wrong password | 401 `Invalid email or password` |
| A3 | GET /auth/me (with token) | — | 200, admin email + roles |
| A4 | GET /auth/me (no token) | — | 401 generic JSON |
| A5 | POST /auth/refresh | token | 200, new `token` |

### Module B — Users (RBAC)
| # | Request | Body | Expect |
|---|---------|------|--------|
| B1 | POST /users | `{"email":"recepcion.nueva@olimpo.com","password":"abc123","firstName":"Laura","lastName":"Pineda","phone":"3110000001","roles":["RECEPCIONIST"]}` | 201 |
| B2 | POST /users (duplicate email of B1) | same body | 409 |
| B3 | POST /users with `roles:["CLIENT"]` | via /users | 400 (`cannot be assigned via user management`) |
| B4 | POST /users with `roles:["OTRA"]` | | 400 (`Invalid role`) |
| B5 | GET /users?page=0&size=2&search=admin | — | 200 page object with content + pagination metadata (only ADMIN may call) |
| B6 | GET /users as RECEPCIONIST | — | 403 |
| B7 | PATCH /users/{id}/roles ADMIN doing it | `{"roles":["TRAINER"]}` | 200, roles replaced |
| B8 | PATCH /users/{id}/roles as RECEPCIONIST | — | 403 |

### Module C — Clients, memberships, payments
| # | Request | Body | Expect |
|---|---------|------|--------|
| C1 | POST /clients (ADMIN) | `{"email":"cliente3.test@olimpo.com","password":"cli123","firstName":"Sofia","lastName":"Mendez","documentNumber":"1039555888","sex":"F","fitnessGoal":"Definicion"}` | 201 with `clientId` |
| C2 | POST /clients as TRAINER | — | 403 |
| C3 | GET /clients/{C1id} | — | 200 |
| C4 | POST /memberships `{"clientId":1,"type":"MONTHLY","price":120000,"method":"CASH"}` | | 201 (payment auto-registered) |
| C5 | POST /memberships again same client `type:"MONTHLY"` | | 409 (`already has an ACTIVE membership`) |
| C6 | POST /memberships `type:"DAILY"` for a DIFFERENT client id | | 201 (daily passes are memberships too) |
| C7 | POST /memberships `type:"YEARLY"` | | 400 (`Invalid membership type`) |
| C8 | GET /memberships/active (ADMIN) | — | 200 |
| C9 | GET /memberships/active (CLIENT token) | — | 200 (own membership only) |
| C10 | PATCH /memberships/{id}/renew `{"type":"QUARTERLY","price":80000,"method":"CARD"}` | | 200, end_date extended ~15 days |
| C11 | POST /payments `{"membershipId":{id},"amount":50000,"method":"NEQUI","reference":"REF-1"}` | | 201 |
| C12 | POST /payments `amount:0` | | 400 |
| C13 | GET /clients/{otherId} as CLIENT (cliente1 viewing cliente2) | — | 403 |

### Module D — Inventory (NO RECEPCIONIST on purpose)
| # | Request | Body | Expect |
|---|---------|------|--------|
| D1 | POST /inventory/items `{"name":"Whey protein 1kg","category":"Suplementos","unit":"KG"}` | | 201, `quantity=0`, `minStock=5`, `lowStock=true` |
| D2 | POST /inventory/items/{id}/movements `{"type":"INBOUND","quantity":40}` | | 201 |
| D3 | POST /inventory/items/{id}/movements `{"type":"OUTBOUND","quantity":100}` | | 409 (`Insufficient stock`) |
| D4 | POST /inventory/items/{id}/movements `{"type":"STOLEN","quantity":1}` | | 400 (`Invalid movement type`) |
| D5 | GET /inventory/items/low-stock?page=0&size=20 | | 200 page object |
| D6 | PATCH /inventory/items/{id} `{"name":"Whey protein 1kg","quantity":20,"minStock":4}` | | 200, `lowStock=false` |
| D7 | GET /inventory/items/{id}/movements?page=0&size=20 | | 200 page object (history, newest first) |
| D8 | POST /inventory/items as RECEPCIONIST | — | 403 (rule: sometimes she is absent) |
| D9 | POST /machines `{"name":" smith machine","brand":"NordicTrack","serialNumber":"NT-X1-9"}` | | 201, `status=AVAILABLE` |
| D10 | POST /machines again with same serial | | 409 |
| D11 | PATCH /machines/{id} `{"name":"Smith machine","brand":"NordicTrack","serialNumber":"NT-X1-9","status":"MAINTENANCE"}` | | 200 |
| D12 | GET /machines?status=MAINTENANCE&page=0&size=20&search=smith | — | 200 page object filtered by status and text |
| D13 | PATCH /machines/{id} `status:"ROTA"` | | 400 |

### Module E — Trainer schedules (dayOfWeek: 1=Sunday … 7=Saturday)
| # | Request | Body | Expect |
|---|---------|------|--------|
| E1 | POST /trainers/{trainerId}/schedules as ADMIN | `[{"dayOfWeek":2,"startTime":"06:00","endTime":"10:00"},{"dayOfWeek":7,"startTime":"08:00","endTime":"12:00","status":"NOT_AVAILABLE"}]` | 200 (replaces week), `dayName` = "Monday"/"Saturday" |
| E2 | POST /trainers/{id}/schedules overlapping same day | `[{dayOfWeek:3, 08:00-12:00},{dayOfWeek:3, 10:00-14:00}]` | 409 `Overlapping slots` |
| E3 | POST /trainers/{id}/schedules `dayOfWeek:8` | | 400 |
| E4 | POST /trainers/{id}/schedules `{"startTime":"18:00","endTime":"09:00"}` | | 400 |
| E5 | POST /trainers/{id}/schedules `status:"FERIADO"` | | 400 |
| E6 | GET /trainers/{trainerId}/schedules (ADMIN) | — | 200 |
| E7 | GET own schedule as trainer2 (trainer id 1) | — | 200 |
| E8 | GET /trainers/2/schedules as trainer2 (another trainer's) | — | 403 `Trainers can only manage their own schedule` |
| E9 | GET /trainers/{id}/schedules as RECEPCIONIST and as CLIENT | — | 403 |
| E10 | POST /trainers/{id}/schedules as trainer2 on own id | | 200 |

### Module F — Routines
| # | Request | Body | Expect |
|---|---------|------|--------|
| F1 | POST /routines `{"name":"Full body general","type":"GENERAL","description":"3 days adapted plan"}` | | 201, `price:null`, `trainerId:null` |
| F2 | POST /routines GENERAL with `price` | | 400 (`Price is only allowed for CUSTOM routines`) |
| F3 | POST /routines `{"name":"Custom plan A","type":"CUSTOM","price":80.00,"trainerId":2}` (ADMIN) | | 201 with trainerName |
| F4 | POST /routines CUSTOM without price | | 400 |
| F5 | POST /routines `type:"PREMIUM"` | | 400 |
| F6 | POST /routines CUSTOM as trainer (no trainerId) | | 201 with own trainerId |
| F7 | GET /routines?type=CUSTOM&page=0&size=20&search=plan | — | 200 page object filtered by type and text |
| F8 | POST /routines/{id}/assignments `{"clientId":1}` | | 201, `status=ACTIVE`, `assignmentDate=today` |
| F9 | POST /routines/{id}/assignments `{"clientId":9999}` | | 404 |
| F10 | POST /routines/{id}/assignments `{"clientId":1,"status":"FINALIZADA"}` | | 400 |
| F11 | GET /routines/{id}/assignments?page=0&size=20 | | 200 page object (ADMIN/TRAINER/recepcionist ok) |
| F12 | GET /clients/1/routines?page=0&size=20 as cliente1 | — | 200 page object, own assignments |
| F13 | GET /clients/1/routines as cliente2 | — | 403 |
| F14 | POST /routines as CLIENT | — | 403 |

### Pagination and search checks
| # | Request | Expect |
|---|---------|--------|
| P1 | GET /clients?page=0&size=1&search=cliente1 as ADMIN | 200, at most one `content` item and populated metadata |
| P2 | GET /clients?page=0&size=101 as ADMIN | 400, unified error JSON |
| P3 | GET /clients?page=-1 as ADMIN | 400, unified error JSON |
| P4 | GET /clients/1/payments?page=0&size=20&search=NEQUI as cliente1 | 200 page object; other clients remain inaccessible |

### Module G — Error-shape checks (cross-cutting)
| # | Request | Expect | Asserts |
|---|---------|--------|---------|
| G1 | GET /users without token | 401 | body has exactly `status=401`, `error=Unauthorized`, `message` non-empty |
| G2 | login with wrong password | 401 | message == `Invalid email or password` (no email confirmation) |
| G3 | GET /nonexistent-endpoint | 404 | `message=Resource not found` |
| G4 | PUT /users | 405 | `error=Method Not Allowed` |
| G5 | GET /users/abc | 400 | `message=Invalid request parameter: id` |
| G6 | login with malformed JSON `{email:}` | 400 | `message=Malformed or unreadable JSON request body` |
| G7 | POST /users `{"email":"bad","password":"123"}` | 400 | message joins `email: ...; password: ...` |
| G8 | Any failed request | — | response NEVER contains `Exception`, `at server.olimpo`, SQL text, or `passwordHash` |

## 3. Post-collection checks (global test script)

For every response, verify content expectations:

```javascript
pm.test("JSON error shape on failure", () => {
    if (pm.response.code >= 400) {
        const body = pm.response.json();
        pm.expect(body).to.have.property("status");
        pm.expect(body).to.have.property("error");
        pm.expect(body).to.have.property("message");
        pm.expect(JSON.stringify(body)).to.not.include("at server.olimpo");
        pm.expect(JSON.stringify(body)).to.not.include("passwordHash");
    }
});
```

## 4. Notes that may confuse you

- `PUT`/`DELETE`/`GET`-list rules: updates use **PATCH** (items, machines, user roles, membership renew). Don't expect PUT or DELETE routes (they don't exist yet).
- `dayOfWeek=1` is **Sunday**, not Monday (MySQL DAYOFWEEK). `dayName` in responses is derived: 2→Monday, 7→Saturday.
- Successfully replacing a weekly schedule returns **200** (not 201) even though it's a POST — it's an upsert of the whole week.
- General routines have `trainerId: null` and `price: null` on purpose.
- Current seeded data ids in the local DB: item 1, machines 1–2, routines 1–3, trainer profiles 1–2, clients 1–2. Tests adding duplicates of unique fields will 409, that is correct behavior.
