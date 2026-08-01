# Warehouse Inventory System — Copilot Instructions

## Purpose

You are an AI coding assistant working on the Warehouse Inventory System. Follow the project documentation first, then implement changes in small, verified steps.

## Approved Stack

- Frontend: Angular 21.3.11
- UI library: Angular Material
- Frontend state/reactivity: Angular Signals
- Backend: Java + Spring Boot
- Database: SQLite

Do not invent additional frameworks, libraries, or architectural layers unless the documentation is updated first.

## Required Workflow

1. Read the relevant project documents before coding.
2. Explain the approach and list the files you expect to change.
3. Implement one documented task or one logical feature at a time.
4. Verify the change against the task outcome and the project documents.
5. Write or update tests when the change affects behavior.
6. Update documentation when behavior, API, database, or architecture changes.
7. Review the code for unnecessary refactoring before presenting it.

## Documentation Rules

- Always read `docs/01-project-overview.md` first.
- Then read the most relevant documents for the task:
	- `docs/02-functional-requirements.md`
	- `docs/03-non-functional-requirements.md`
	- `docs/04-architecture.md`
	- `docs/05-database-design.md`
	- `docs/06-api-specification.md`
	- `docs/07-backend-design.md`
	- `docs/08-frontend-design.md`
	- `docs/09-development-plan.md`
	- `docs/10-ai-development-workflow.md`
- Treat documentation as the source of truth.
- If documentation is missing or unclear, ask for clarification instead of guessing.

## Implementation Rules

- Implement one task at a time.
- Keep changes minimal and focused on the task.
- Reuse existing code whenever possible.
- Do not refactor unrelated code.
- Do not add abstractions unless they are clearly needed.
- Keep backend code aligned with Spring Boot, Java, and SQLite design decisions.
- Keep frontend code aligned with Angular 21 standalone components, Signals, Reactive Forms, and Angular Material.
- Use Angular Material consistently for UI components, dialogs, tables, form controls, and navigation where appropriate.

## Backend Rules

- Use Java and Spring Boot for all backend work.
- Follow the layered architecture in `docs/04-architecture.md` and `docs/07-backend-design.md`.
- Keep dependency direction inward: controller → service → repository → domain.
- Use DTOs at the API boundary.
- Enforce validation and business rules in the service layer.
- Use global exception handling for all API errors.
- Preserve SQLite design constraints and business rules.

## Frontend Rules

- Use Angular 21.3.11 with standalone components.
- Use Angular Signals for local and feature state.
- Use Angular Reactive Forms for forms.
- Use Angular Material as the approved UI library.
- Use the shared/core/feature folder structure from the frontend design document.
- Keep HTTP logic inside services and use interceptors for cross-cutting concerns.
- Map API validation errors to form controls when applicable.

## Testing Rules

- Add or update tests whenever behavior changes.
- Aim for at least 70% unit test coverage across backend and frontend.
- Test business rules, validation, error handling, and critical user flows.
- Do not use fake implementations in production code.

## Verification Rules

- Validate the change against the related design document.
- Check edge cases and error paths.
- Confirm the code compiles/builds after changes.
- Run the most specific tests possible for the area changed.

## Code Review Rules

- Check for unnecessary refactoring and remove it.
- Confirm naming matches the project documents.
- Confirm API field names, database fields, and UI behavior remain consistent.
- Confirm no sensitive data is logged or exposed.

## When Context Is Missing

- Ask a direct clarification question.
- State what is missing and which document should define it.
- Do not invent behavior, field names, or dependencies.

## Short Version

- Read docs first.
- Plan before coding.
- Implement one task at a time.
- Verify and test each change.
- Update docs when behavior changes.
- Use Angular Material, Angular, Java, Spring Boot, and SQLite exactly as documented.
