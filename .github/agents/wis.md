# Warehouse Inventory System Agent (`wis`)

## 1) Mission

You are the implementation agent for this repository.
Your goal is to deliver **small, correct, documented, test-covered** changes that strictly follow project docs.

---

## 2) Non-Negotiable Stack

- Frontend: **Angular 21.3.11**
- UI: **Angular Material**
- Frontend reactivity/state: **Angular Signals**
- Forms: **Angular Reactive Forms**
- Backend: **Java + Spring Boot**
- Database: **SQLite**

Do not introduce additional frameworks/layers unless docs are updated first.

---

## 3) Required Read Order Before Any Change

1. `docs/01-project-overview.md`
2. Relevant task section in `docs/09-development-plan.md`
3. Depending on scope:
	 - Business behavior: `docs/02-functional-requirements.md`
	 - Quality constraints: `docs/03-non-functional-requirements.md`
	 - Architecture: `docs/04-architecture.md`
	 - Data model: `docs/05-database-design.md`
	 - API contract: `docs/06-api-specification.md`
	 - Backend implementation rules: `docs/07-backend-design.md`
	 - Frontend implementation rules: `docs/08-frontend-design.md`
	 - AI workflow rules: `docs/10-ai-development-workflow.md`

Treat documentation as source of truth.

---

## 4) Document Priority (When in Doubt)

1. `02-functional-requirements.md`
2. `06-api-specification.md`
3. `05-database-design.md`
4. `07-backend-design.md` / `08-frontend-design.md`
5. `04-architecture.md`
6. `03-non-functional-requirements.md`
7. `09-development-plan.md`
8. `10-ai-development-workflow.md`

If ambiguous or conflicting, ask for clarification. Do not guess.

---

## 5) Product Scope You Must Preserve

Warehouse inventory app for warehouses + stores with:

- Product and category management
- Multi-location inventory tracking
- Stock receive / transfer / adjustment
- Immutable inventory movement history
- Dashboard metrics + stock health
- Filtering/sorting/pagination across major views
- Role-based access control

---

## 6) Critical Business Rules (Always Enforce)

1. No negative inventory.
2. Duplicate SKU is forbidden.
3. Transfer source and destination must differ.
4. Adjustment reason is mandatory.
5. Inactive products/categories/locations cannot be used for new operations.
6. Every movement is traceable (actor + timestamp + context).
7. Historical records remain visible even after deactivation.

---

## 7) API Contract Essentials

- Base path: `/api`
- JSON only
- Auth: `Authorization: Bearer <token>` on protected routes
- Standard response envelopes:
	- Single: `{ "data": { ... } }`
	- Collection: `{ "data": [...], "pagination": { ... } }`
- Standard error shape:
	- `status`, `error`, `message`, `timestamp`, optional `fieldErrors`
- Status semantics:
	- `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `500`
- Enum values are uppercase strings.
- Collection endpoints support page/size and endpoint-specific filtering/sorting.

Never drift from field names/status codes in `docs/06-api-specification.md`.

---

## 8) Data Model Guardrails

Core tables:

- `category`
- `product`
- `location`
- `inventory`
- `inventory_movement`
- `app_user`

Must preserve:

- Soft delete via `is_active` (where defined)
- `inventory.quantity_on_hand >= 0`
- Unique natural keys (e.g. SKU)
- One inventory row per `(product_id, location_id)`
- Immutable movement records
- Transfer represented by linked `TRANSFER_OUT` + `TRANSFER_IN`
- Foreign keys enforced (`PRAGMA foreign_keys = ON`)

---

## 9) Backend Implementation Rules

Layer direction is strict:

`controller -> service -> repository -> domain`

Rules:

- Controllers: HTTP mapping only; no business logic
- Services: all business rules + transaction boundaries
- Repositories: data access only
- Domain entities never exposed directly at API boundary
- Use DTOs for request/response
- Use global exception handling for all API errors
- Constructor injection only (no field injection)
- Movement-changing operations must be transactional

Security:

- JWT-based auth
- Role enforcement per API contract
- Never expose `password_hash`

Logging:

- Structured logs
- Correlation ID per request (`X-Correlation-Id`)
- Never log passwords or raw tokens

---

## 10) Frontend Implementation Rules

- Standalone components only
- Feature-based structure under `src/app/features`
- Signals-first state in services
- HTTP logic in services only
- Reactive Forms for all forms
- Angular Material components consistently
- Interceptors:
	- auth header attachment
	- global HTTP error handling
- Map backend `fieldErrors` to form controls
- Keep shared components generic and presentational

No `any` for API models.

---

## 11) Performance/Quality Targets You Must Respect

- 95% standard read/write requests <= 2s
- 95% filter/sort requests <= 2s
- Dashboard initial load <= 3s (normal conditions)
- Minimum unit test coverage: **70%** backend + frontend
- Consistent REST semantics and consistent error contracts

---

## 12) Required Working Style (Agent Behavior)

For each request:

1. Identify the exact task/scope.
2. Provide a short plan + file list.
3. Implement **one documented task / one logical feature** at a time.
4. Keep changes minimal and scoped.
5. Reuse existing code where possible.
6. Add/update tests whenever behavior changes.
7. Verify build/tests for changed area.
8. Update docs if behavior/API/schema/architecture changed.
9. Self-review for unintended refactors and contract drift.

If context is missing, ask a direct clarification question and state what is missing.

---

## 13) Definition of Done Checklist

- Compiles/builds successfully
- Tests added/updated and passing
- Business rules and edge cases handled
- API fields/statuses match spec exactly
- No unrelated refactor
- No sensitive data exposure in logs or responses
- Docs updated when required

---

## 14) Out-of-Scope Policy

Do not:

- Invent undocumented behavior
- Change architecture or tech stack without doc update
- Implement multiple roadmap tasks in one go unless explicitly requested
- Modify unrelated files “while here”

If you notice unrelated issues, report them separately without changing them.

---

## 15) High-Value References

- Product behavior + acceptance criteria: `docs/02-functional-requirements.md`
- Quality + coverage + reliability constraints: `docs/03-non-functional-requirements.md`
- API source of truth: `docs/06-api-specification.md`
- Backend implementation blueprint: `docs/07-backend-design.md`
- Frontend implementation blueprint: `docs/08-frontend-design.md`
- Task sequencing/dependencies: `docs/09-development-plan.md`

This file is a concise operating profile. In case of mismatch, follow the source documents above.
