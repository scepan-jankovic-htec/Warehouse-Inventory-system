# Warehouse Inventory System — AI Development Workflow

## 1. Document Purpose

This document defines the permanent workflow for AI-assisted development on the Warehouse Inventory System project. Every AI session — whether implementing a new feature, fixing a defect, or updating documentation — must follow this workflow without exception.

This document is not optional guidance. It is the operating agreement between the developer and the AI assistant for this project.

---

## 2. Project Documentation Map

Before doing any work, an AI assistant must know which document answers which question. The following map is the index to the project knowledge base.

| Document | Answers |
|---|---|
| `01-project-overview.md` | What the application is, who uses it, what it does, and what technology is used |
| `02-functional-requirements.md` | What the system must do — user behaviors, business rules, acceptance criteria, edge cases |
| `03-non-functional-requirements.md` | Quality requirements — performance, security, validation, testing coverage, logging, error handling |
| `04-architecture.md` | How the system is structured — layers, responsibilities, dependency direction, package and folder layout |
| `05-database-design.md` | Database tables, columns, constraints, indexes, relationships, and database-level business rules |
| `06-api-specification.md` | Every REST endpoint, HTTP method, request/response shapes, status codes, error codes, pagination/filtering conventions |
| `07-backend-design.md` | Spring Boot packages, entities, DTOs, services, controllers, validation, exception handling, logging, testing strategy |
| `08-frontend-design.md` | Angular folder structure, standalone components, signals, services, routing, forms, HTTP communication, testing strategy |
| `09-development-plan.md` | Task-by-task implementation roadmap with dependencies, expected outcomes, and verification steps |
| `10-ai-development-workflow.md` | This document — how to work on this project |

---

## 3. Mandatory Pre-Work: Read Before Writing

**Rule: No code is written before relevant documentation is read.**

This is the most important rule in this document. The documentation exists to prevent wrong assumptions. An AI assistant that skips this step will produce code that contradicts established decisions.

### 3.1 What to Read for Any Task

Before starting any task, read the following minimum set of documents:

1. **Always read:** `01-project-overview.md` — for orientation.
2. **Always read:** The relevant section of `09-development-plan.md` — for the current task's goal, description, dependencies, expected outcome, and verification steps.
3. **Read if touching backend entities, migrations, or queries:** `05-database-design.md`.
4. **Read if touching backend controllers, services, or DTOs:** `06-api-specification.md` and `07-backend-design.md`.
5. **Read if touching Angular components, services, routing, or forms:** `06-api-specification.md` and `08-frontend-design.md`.
6. **Read if the task involves business rules:** `02-functional-requirements.md`.
7. **Read if the task involves validation, coverage, or error handling:** `03-non-functional-requirements.md`.

### 3.2 What "Reading" Means

Reading means understanding the relevant content, not skimming for keywords. Specifically:

- Identify the exact fields, constraints, and behavior described for the area being implemented.
- Check for cross-references between documents (for example, an API field referenced in both `06` and `07`).
- Note any stated rules that must not be violated (for example, `password_hash` never in a response DTO; `inventory_movement` records are immutable).

### 3.3 When to Re-Read

Re-read documentation when:
- Starting a new task after a break or context switch.
- Implementing a component that touches multiple features.
- Uncertain about a constraint, field name, or behavior.

---

## 4. Planning Before Implementation

**Rule: Always produce a plan before writing code. Never jump directly to implementation.**

### 4.1 What a Plan Must Include

For every implementation task, state the following before writing code:

1. **What is being built** — a one-sentence summary of the feature or change.
2. **Which files will be created or modified** — explicit list of file paths.
3. **What dependencies exist** — other classes, services, or tasks this depends on.
4. **What business rules apply** — from `02-functional-requirements.md`.
5. **What constraints apply** — from `03-non-functional-requirements.md`, `05-database-design.md`, `07-backend-design.md`, or `08-frontend-design.md`.
6. **What tests will be written** — unit tests or integration tests that will verify the outcome.
7. **What risks exist** — anything that could go wrong or requires particular care.

### 4.2 When to Ask for Approval

Ask for approval before starting implementation when:
- The task is a major phase transition (for example, moving from database to backend, or backend to frontend).
- The plan involves architectural decisions not explicitly covered in documentation.
- The approach would require changing existing, already-implemented code outside the scope of the current task.

Do not ask for approval for tasks that are fully specified in `09-development-plan.md` and whose approach is unambiguous from the existing documentation.

### 4.3 Plan Format

```
Task: <task ID and name>
Files to create: <list>
Files to modify: <list>
Business rules: <relevant FR references>
Constraints: <relevant NFR or design references>
Tests: <what unit/integration tests will be written>
Risks: <anything that requires care>
```

---

## 5. Implementing One Feature at a Time

**Rule: Implement exactly one task from `09-development-plan.md` per session. Do not implement the next task until the current one is verified.**

### 5.1 What "One Feature" Means

One feature corresponds to one task in `09-development-plan.md`. A task is scoped to be completable and verifiable in a single AI session. Examples:

- Implementing `CategoryService` and `CategoryController` is one task (BE-15).
- Creating the `category` table migration is one task (DB-04).
- Implementing the `CategoryListComponent` and `CategoryFormComponent` is one task (FE-10).

Do not merge multiple tasks into a single session. Do not start BE-16 before BE-15 is verified.

### 5.2 Implementation Rules

When writing code for a task:

1. **Follow the documented design exactly.** Package names, class names, field names, and method signatures must match what is specified in `07-backend-design.md` and `08-frontend-design.md`.
2. **Follow the API contract exactly.** Every request body, response body, field name, and status code must match `06-api-specification.md`.
3. **Follow database column names exactly.** Entity field mappings must match the column names in `05-database-design.md`.
4. **Reuse existing code.** Do not rewrite something that already exists in the codebase. Check for existing utility classes, mappers, exceptions, and shared components before creating new ones.
5. **Keep changes minimal.** Implement exactly what the current task requires. Do not add extra fields, methods, or abstractions that are not specified.
6. **Do not change unrelated code.** If implementing `ProductService` and a bug in `CategoryService` is noticed, note it and do not fix it within the current task.
7. **Do not introduce dependencies that are not in the technology stack.** The stack is defined in `01-project-overview.md`. New libraries require explicit approval.

### 5.3 Dependency Order

Always verify that the task's listed dependencies in `09-development-plan.md` are complete before starting. Starting a task whose dependencies are unfinished will produce broken code.

---

## 6. Verifying Implementation

**Rule: Every task must be verified against its Expected Outcome and Verification criteria before it is considered complete.**

### 6.1 Verification Checklist

After implementing a task, confirm the following:

- [ ] The application compiles (or `ng build` completes) without errors.
- [ ] The expected outcome described in `09-development-plan.md` is satisfied.
- [ ] The verification steps described in the task have been performed.
- [ ] No unrelated code has been changed.
- [ ] No hardcoded values that should be configurable have been introduced.
- [ ] All field names in API responses match `06-api-specification.md` exactly.
- [ ] All entity field mappings match `05-database-design.md` exactly.
- [ ] Password fields are never exposed in any response.
- [ ] Inventory movement records are never updated or deleted in any code path.

### 6.2 Checking Business Rule Coverage

For backend service tasks, verify each business rule from `02-functional-requirements.md` that applies to the feature is enforced:

- Non-negative stock: `MovementService` raises `InsufficientStockException` when quantity would go below zero.
- SKU uniqueness: `ProductService` raises `DuplicateResourceException` before any save attempt.
- Adjustment reason required: `AdjustStockRequest` has `@NotBlank` on `reason`; service does not process a request with a blank reason.
- Transfer source ≠ destination: validated in `MovementService` before any database operation.

### 6.3 Checking Non-Functional Compliance

After implementation, check that the following NFR rules are not violated:

- No sensitive data (passwords, tokens) appears in any log output.
- All error responses use the `ApiErrorResponse` shape from `06-api-specification.md`.
- All database write operations in a service method are wrapped in a transaction.
- No `any` type is used in TypeScript code.
- Constructor injection is used exclusively in the backend (no field `@Autowired`).

---

## 7. Writing Tests

**Rule: Tests are written as part of the task, not deferred to later. A task is not complete until its required tests pass.**

### 7.1 Coverage Target

The project requires **minimum 70% unit test coverage** across both backend and frontend, as defined in NFR-TEST-001.

### 7.2 Backend Testing Rules

- Unit tests use JUnit 5 and Mockito.
- Every service class has a corresponding unit test class.
- Service tests mock all repository dependencies.
- Every business rule has at least one test case — including the failure case.
- The global exception handler has a test for every exception type it handles.
- Integration tests use `@SpringBootTest` with `MockMvc` for HTTP-level assertions.
- The `test` Spring profile is always active during test execution.

**Minimum test cases per service (backend):**

| Scenario | Test type |
|---|---|
| Successful create | Unit |
| Duplicate unique field | Unit — asserts exception type |
| Not found by ID | Unit — asserts `ResourceNotFoundException` |
| Deactivate active resource | Unit |
| Deactivate already-inactive resource | Unit — asserts `InvalidOperationException` |
| Business rule violation (for example, negative stock) | Unit — asserts exception type |
| Controller returns correct status code | Integration (MockMvc) |
| Controller returns `400` on invalid request body | Integration (MockMvc) |

### 7.3 Frontend Testing Rules

- Tests use Jest (or Jasmine + Karma if configured differently).
- Every service has tests covering signal state changes after HTTP calls.
- No real HTTP calls are made in any test — use `HttpTestingController`.
- Every form component has tests for each validation rule.
- Shared components have tests for input/output behavior.
- Guard tests confirm redirect behavior for unauthorized users.

### 7.4 Test Naming Convention

Test names must clearly state the scenario. Prefer the format:

```
<method or component> — <condition> — <expected result>
```

Examples:
- `createCategory — duplicate name — throws DuplicateResourceException`
- `TransferFormComponent — same source and destination — shows cross-field validation error`
- `AuthGuard — unauthenticated user — redirects to /login`

### 7.5 Test Data

- Test data must be defined in the test class or a shared fixture file.
- Production code must never contain test data or test-only branches.
- Database tests use an isolated in-memory SQLite database or H2 in compatibility mode under the `test` Spring profile.

---

## 8. Updating Documentation

**Rule: When implementation changes or extends any behavior described in the documentation, the relevant document must be updated in the same session.**

### 8.1 When to Update Documentation

| Change | Document to update |
|---|---|
| A new API field is added | `06-api-specification.md` |
| A business rule is changed or clarified | `02-functional-requirements.md` |
| A package or class name changes from what was planned | `07-backend-design.md` or `08-frontend-design.md` |
| A new table or column is added | `05-database-design.md` |
| A task in the plan is completed | `09-development-plan.md` (mark as complete) |
| A new architectural decision is made | `04-architecture.md` |
| A quality standard changes | `03-non-functional-requirements.md` |

### 8.2 What Not to Update

Do not update documentation to describe implementation details, internal variable names, or code structure that is not architecturally significant. Documentation describes **what** the system does and **why** it is structured as it is — not how a specific method loops over a collection.

### 8.3 Keeping Documentation in Sync

Documentation is out of sync when:
- The API response shape in code differs from `06-api-specification.md`.
- A class exists in code that has no corresponding entry in `07-backend-design.md` or `08-frontend-design.md`.
- A database column exists in a migration that is not described in `05-database-design.md`.

When a sync gap is found, update the documentation first, then confirm the implementation matches, in the same session.

---

## 9. Reviewing Code

**Rule: Before presenting implementation as complete, perform a self-review against the checklist below.**

### 9.1 Self-Review Checklist

**Correctness:**
- [ ] Does the implementation satisfy the task's Expected Outcome from `09-development-plan.md`?
- [ ] Do all business rules from `02-functional-requirements.md` apply to this feature pass?
- [ ] Do all edge cases from `02-functional-requirements.md` section 8 that apply to this feature pass?

**Architecture:**
- [ ] Does the code follow the layer responsibilities defined in `04-architecture.md`?
- [ ] Does the backend dependency direction flow inward (controller → service → repository → domain)?
- [ ] Does the frontend follow the service-with-signals pattern from `08-frontend-design.md`?
- [ ] Are all new backend classes in the correct package as defined in `07-backend-design.md`?
- [ ] Are all new Angular files in the correct folder as defined in `08-frontend-design.md`?

**API contract:**
- [ ] Do all response DTO field names match `06-api-specification.md` exactly?
- [ ] Are all HTTP status codes correct?
- [ ] Is the error response shape using `ApiErrorResponse` for all error cases?

**Data integrity:**
- [ ] Are all database write operations within a transaction?
- [ ] Does the code prevent negative inventory at the service level and rely on the database CHECK as a safety net only?
- [ ] Is `password_hash` absent from all response paths?

**Code quality:**
- [ ] Is constructor injection used for all Spring beans?
- [ ] Are there no `any` types in TypeScript?
- [ ] Are there no hardcoded secrets or environment-specific values in application code?
- [ ] Is logging present for inventory movements and business rule violations?
- [ ] Are there no raw exception messages in HTTP responses?

**Tests:**
- [ ] Do all required tests from the task specification exist?
- [ ] Do all tests pass?
- [ ] Are test names descriptive?

### 9.2 When to Raise a Concern

If during self-review a concern is found that cannot be resolved within the current task scope, it must be explicitly stated to the developer before presenting the implementation. Do not silently leave a known issue.

---

## 10. Avoiding Unnecessary Refactoring

**Rule: Do not refactor code that is not part of the current task.**

### 10.1 Definition of Unnecessary Refactoring

Unnecessary refactoring is any change to existing, working code that:
- Is not required to make the current task work.
- Is not required to fix a failing test.
- Is not required to satisfy a functional or non-functional requirement.
- Is not required to fix a documented bug.

Improving naming, reorganizing imports, adding comments, and extracting helper methods in already-implemented classes are all examples of unnecessary refactoring when done outside the task scope.

### 10.2 When Refactoring Is Permitted

Refactoring is permitted when:
- The current task explicitly requires it (for example, a task that restructures a module).
- A business rule change requires it.
- Existing code is incorrect and causes the current task's tests to fail.
- A code quality issue is severe enough to be a defect (for example, a hardcoded secret or a missing transaction boundary).

Even then, the refactoring scope must be the minimum required to fix the identified problem. Report the change to the developer.

### 10.3 The "I Noticed" Convention

When an improvement opportunity is noticed in unrelated code, the correct response is:

> "I noticed [description of the issue] in [file]. This is outside the current task scope. I will not change it now. It can be addressed in a future task."

This preserves task focus and prevents uncontrolled scope growth.

---

## 11. Asking for Clarification

**Rule: Ask for clarification when required information is genuinely missing. Do not invent answers to unclear requirements.**

### 11.1 When to Ask

Ask for clarification when:
- A behavior is required by a task but not described in any project document.
- Two documents appear to contradict each other.
- A business rule has ambiguous edge case behavior not covered by `02-functional-requirements.md` section 8.
- An API field's allowed values or constraints are not documented.
- A task dependency is marked as required but the dependency does not appear to be complete.

### 11.2 When Not to Ask

Do not ask for clarification when:
- The answer is clearly stated in one of the project documents.
- A reasonable implementation can be derived directly from the documented design without guessing.
- The question is about implementation detail rather than behavior (for example, the exact variable name inside a method body).

### 11.3 How to Ask

When asking for clarification, state:
1. **What is being implemented** — the task ID and feature.
2. **What information is missing** — the specific gap.
3. **What the two or more possible interpretations are** — if applicable.
4. **Which interpretation seems most consistent with the project documentation** — a reasoned recommendation.

Example format:
> "I am implementing TASK BE-20 (Transfer). The task requires validating that `sourceLocationId ≠ destinationLocationId`. The functional requirements (FR-INV-003) confirm this but do not specify whether the validation should be performed before or after checking sufficient stock. I recommend checking location equality first, as it avoids an unnecessary database read. Please confirm."

### 11.4 Do Not Make Silent Assumptions

If a decision is made without explicit clarification, it must be stated explicitly:
> "I assumed [X] because [reasoning from documentation]. If this is incorrect, please advise."

---

## 12. Session Start Protocol

At the start of every AI development session, follow these steps in order:

1. **Read `09-development-plan.md`** to identify the next incomplete task.
2. **Read all documentation relevant to that task** (see section 3.1).
3. **Produce a plan** for the task (see section 4.1).
4. **Confirm dependencies are complete** before starting implementation.
5. **Implement the task** following all rules in section 5.
6. **Write required tests** as part of the implementation.
7. **Perform self-review** using the checklist in section 9.
8. **Update documentation** if any changes are needed (section 8).
9. **Report completion** — state which task was completed, what was implemented, what tests were written, and whether any concerns were noted.

---

## 13. Session End Protocol

At the end of every session, before stopping:

1. Confirm the task's verification steps have been performed.
2. Confirm all tests pass.
3. State any issues found during self-review that were not resolved.
4. State the next task from `09-development-plan.md` so the developer knows what comes next.
5. Do not leave the codebase in a broken or partially-implemented state. If a task cannot be completed in one session, stop at a clean checkpoint — compilable, with no half-written classes or broken imports.

---

## 14. Document Reference Priority

When there is any ambiguity between two sources, use this priority order to resolve it:

1. `02-functional-requirements.md` — defines what the system must do. Highest authority.
2. `06-api-specification.md` — defines the exact contract between frontend and backend.
3. `05-database-design.md` — defines data structure and constraints.
4. `07-backend-design.md` / `08-frontend-design.md` — defines implementation structure.
5. `04-architecture.md` — defines system structure and principles.
6. `03-non-functional-requirements.md` — defines quality rules.
7. `09-development-plan.md` — defines task scope and order.
8. `10-ai-development-workflow.md` — defines how to work.

If two documents at the same priority level appear to conflict, ask for clarification before proceeding.

---

## 15. Quick Reference Card

```
Before coding:      Read all relevant docs. Produce a plan.
While coding:       One task at a time. Match documented names exactly.
After coding:       Verify against expected outcome. Self-review checklist.
Tests:              Write tests as part of the task. Not after. Not later.
Documentation:      Update in the same session as the implementation.
Refactoring:        Only when the current task requires it.
Uncertainty:        Ask. Do not invent. Do not assume silently.
Scope creep:        "I noticed [X]. Out of scope. Will not change now."
Session start:      Read → Plan → Confirm deps → Implement → Test → Review.
Session end:        Tests pass. No broken state. Report completion.
```
