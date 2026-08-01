# Warehouse Inventory System

Warehouse Inventory System is an inventory management application for warehouses and retail stores.

## Project Structure

The repository uses three top-level folders:

- `frontend/` — all Angular frontend logic
- `backend/` — all Java / Spring Boot backend logic
- `database/` — SQLite database files, migrations, and related database assets

## How to Start the Project

### 1. Database

The database layer is based on SQLite.

- The SQLite database file should live in the `database/` folder.
- Database schema changes should be handled through the backend migration process.
- The database is expected to be initialized automatically when the backend starts.
- If a local database file does not exist yet, it should be created on first run.

### 2. Backend

The backend is a Java application built with Spring Boot.

Start the backend from the `backend/` folder.

Typical startup flow:

1. Install the required Java version.
2. Configure the SQLite connection for local development.
3. Run the backend application.
4. Confirm the REST API is available before starting the frontend.

The backend is responsible for:

- business rules
- validation
- authentication and authorization
- REST API endpoints
- database access

### 3. Frontend

The frontend is an Angular 21.3.11 application.

Start the frontend from the `frontend/` folder.

Typical startup flow:

1. Install Node.js and the Angular CLI prerequisites.
2. Configure the frontend environment to point to the backend API.
3. Run the Angular development server.
4. Open the application in a browser after the backend is running.

The frontend is responsible for:

- user interface and navigation
- forms and validation feedback
- data display and filtering
- user interaction with the backend API

## Recommended Development Order

1. Set up the SQLite database structure.
2. Implement the Spring Boot backend.
3. Implement the Angular frontend.

This order keeps the API contract and database design stable before the UI is built.

## Documentation

The project documentation is located in the `docs/` folder. Start with:

- `docs/01-project-overview.md`
- `docs/02-functional-requirements.md`
- `docs/03-non-functional-requirements.md`
- `docs/04-architecture.md`
- `docs/05-database-design.md`
- `docs/06-api-specification.md`
- `docs/07-backend-design.md`
- `docs/08-frontend-design.md`
- `docs/09-development-plan.md`
- `docs/10-ai-development-workflow.md`

## Notes

- Angular Material is the approved UI component library for the frontend.
- Do not introduce additional frameworks or libraries unless the documentation is updated first.
