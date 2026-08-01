# Warehouse Inventory System — Architecture

## 1. Document Purpose

This document describes the complete application architecture for the Warehouse Inventory System. It defines the overall structure, the responsibility of each architectural layer, the communication model between frontend and backend, package and folder organization, and the rationale behind each structural decision.

This document is the primary architectural reference. All implementation work shall align with the structure described here.

---

## 2. Overall Architecture

The application is a client-server, single-page application with a dedicated backend API service and a relational data store.

```
┌─────────────────────────────────────────────────────────────────┐
│                          User (Browser)                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │  HTTP / REST (JSON)
┌─────────────────────────────▼───────────────────────────────────┐
│                  Frontend — Angular 21.3.11                     │
│              (Single-Page Application, served statically)       │
└─────────────────────────────┬───────────────────────────────────┘
                              │  HTTP / REST (JSON)
┌─────────────────────────────▼───────────────────────────────────┐
│                  Backend — Spring Boot (Java)                   │
│              (REST API, Business Logic, Validation)             │
└─────────────────────────────┬───────────────────────────────────┘
                              │  JDBC / ORM
┌─────────────────────────────▼───────────────────────────────────┐
│                        Database — SQLite                        │
│                  (Persistent Inventory Data Store)              │
└─────────────────────────────────────────────────────────────────┘
```

**Why this structure:**  
Separation of the presentation tier, application tier, and data tier ensures that changes in one area do not force changes in others. The frontend is an independently deployable artifact. The backend is the single authority for business rules, validation, and data consistency.

---

## 3. Layer Responsibilities

### 3.1 Frontend (Angular)

| Responsibility | Description |
|---|---|
| User interface rendering | Displays inventory data, forms, and dashboards |
| User interaction handling | Captures user inputs and translates them to API calls |
| Client-side validation | Provides immediate user feedback for format and required-field rules |
| API communication | Issues HTTP requests and handles responses from the backend |
| Routing | Manages navigation between views without full-page reload |
| State management | Holds transient UI state such as active filters and selected locations |

**Why it exists:**  
The frontend exists to deliver a usable, responsive web experience. It is responsible exclusively for presentation concerns and delegates all business decisions to the backend.

---

### 3.2 Backend (Spring Boot)

| Responsibility | Description |
|---|---|
| REST API exposure | Provides the HTTP interface consumed by the frontend |
| Business logic enforcement | Applies inventory rules such as non-negative stock and movement consistency |
| Input validation | Validates requests for completeness, correctness, and business compliance |
| Authorization enforcement | Controls which operations each role may perform |
| Exception handling | Translates failures into consistent, safe API error responses |
| Data access orchestration | Reads and writes inventory data through the persistence layer |
| Audit and traceability | Records actor, timestamp, and context for all inventory movements |

**Why it exists:**  
The backend is the single authoritative layer for business rules and data integrity. No business decision shall be made solely in the frontend. The backend ensures consistent enforcement regardless of which client issues a request.

---

### 3.3 Database (SQLite)

| Responsibility | Description |
|---|---|
| Persistent storage | Stores all inventory, product, category, and movement records |
| Data integrity enforcement | Enforces referential and constraint rules at the storage level |
| Query support | Supports the filtering, sorting, and aggregation operations required by the application |

**Why it exists:**  
The database is the durable record of all inventory state and history. No other layer is responsible for long-term persistence.

---

## 4. Backend Architecture

The backend follows a **layered architecture** pattern with clearly separated responsibilities. Each layer depends only on the layer directly below it.

```
┌───────────────────────────────────────────────┐
│               Controller Layer                │
│   Handles HTTP requests, delegates to service │
└─────────────────────┬─────────────────────────┘
                      │ depends on
┌─────────────────────▼─────────────────────────┐
│                Service Layer                  │
│  Business logic, validation, orchestration    │
└─────────────────────┬─────────────────────────┘
                      │ depends on
┌─────────────────────▼─────────────────────────┐
│              Repository Layer                 │
│  Data access, queries, persistence operations │
└─────────────────────┬─────────────────────────┘
                      │ depends on
┌─────────────────────▼─────────────────────────┐
│                 Domain Layer                  │
│        Entities, value types, enums           │
└───────────────────────────────────────────────┘
```

### 4.1 Controller Layer

- Accepts incoming HTTP requests and maps them to service calls.
- Handles request deserialization and response serialization.
- Performs basic structural validation of request content.
- Returns appropriate HTTP status codes and response bodies.
- Delegates all business logic to the service layer; contains no business decisions.

### 4.2 Service Layer

- Contains all business logic and workflow orchestration.
- Enforces business rules defined in the functional requirements (for example: non-negative stock, mandatory reasons, duplicate SKU prevention).
- Coordinates multiple repository operations where necessary.
- Raises business exceptions that are translated by the global exception handler.
- Is the correct boundary for transactional behavior.

### 4.3 Repository Layer

- Provides data access operations for each domain entity.
- Handles queries, filters, and persistence operations.
- Has no knowledge of business rules.
- Is consumed only by the service layer.

### 4.4 Domain Layer

- Defines the core entities: Product, Category, Location, Inventory, InventoryMovement.
- Contains enumerations for movement types, stock states, and roles.
- Has no dependencies on other layers.

### 4.5 Data Transfer Objects (DTOs)

- DTOs are used to transfer data between the controller and the frontend.
- Domain entities are not exposed directly to the API.
- Request DTOs carry inbound data; response DTOs carry outbound data.
- This separation allows domain models to evolve without affecting the API contract.

### 4.6 Global Exception Handling

- A dedicated exception handler intercepts all unhandled exceptions.
- Translates business exceptions and validation failures to consistent JSON error responses.
- Ensures no raw error detail is exposed to the client.

---

## 5. Frontend Architecture

The Angular frontend follows a **feature-module architecture** organized around business domains, with shared infrastructure centralized.

```
┌───────────────────────────────────────────────┐
│                 Page Components               │
│   Smart containers — route entry points       │
└─────────────────────┬─────────────────────────┘
                      │ uses
┌─────────────────────▼─────────────────────────┐
│             Presentational Components         │
│   Stateless UI building blocks                │
└─────────────────────┬─────────────────────────┘
                      │ uses
┌─────────────────────▼─────────────────────────┐
│                  Services                     │
│   HTTP communication, state, data mapping     │
└─────────────────────┬─────────────────────────┘
                      │ uses
┌─────────────────────▼─────────────────────────┐
│               Models / Interfaces             │
│   TypeScript types mirroring API contracts    │
└───────────────────────────────────────────────┘
```

### 5.1 Page Components (Smart Components)

- Route-level entry points for each business feature.
- Responsible for fetching data via services and coordinating child components.
- Contain view-level state (for example: selected filters, loading state).

### 5.2 Presentational Components

- Receive data through `@Input` properties and emit events through `@Output`.
- Have no direct dependency on services or routing.
- Designed for reuse across multiple contexts.

### 5.3 Services

- Encapsulate all HTTP communication with the backend API.
- Map API responses to typed frontend models.
- May hold shared state accessible across components.

### 5.4 Models / Interfaces

- TypeScript interfaces reflecting the API contract.
- Kept aligned with backend response DTOs.
- Used throughout components and services for type safety.

### 5.5 Routing

- Route definitions are organized per feature module.
- Lazy loading is applied to feature modules to reduce initial bundle size.
- Route guards enforce authentication and role-based access at the navigation level.

---

## 6. Communication Between Frontend and Backend

The frontend and backend communicate exclusively through a REST API over HTTP.

```
Frontend (Angular)                          Backend (Spring Boot)
       │                                            │
       │── GET /api/products?category=... ─────────▶│
       │                                            │── Service Layer
       │                                            │── Repository Layer
       │◀─── 200 OK { data: [...] } ───────────────│
       │                                            │
       │── POST /api/inventory/movements ──────────▶│
       │    { product, location, qty, reason }      │── Validate
       │                                            │── Business Rule Check
       │                                            │── Persist
       │◀─── 201 Created { movement: {...} } ───────│
       │                                            │
       │── POST /api/products (invalid) ───────────▶│
       │                                            │── Validation Failure
       │◀─── 400 Bad Request { error: "..." } ──────│
```

**Key conventions:**

- The frontend always initiates requests; the backend never pushes unsolicited data.
- All request and response bodies use JSON.
- No business logic is shared or duplicated between frontend and backend.
- The frontend performs client-side validation for user experience only; the backend is the authoritative validator.

---

## 7. REST API Principles

The API follows standard REST conventions.

| Principle | Application |
|---|---|
| Resource-based URIs | Nouns, not verbs: `/api/products`, `/api/inventory/movements` |
| HTTP method semantics | `GET` reads, `POST` creates, `PUT` replaces, `PATCH` updates, `DELETE` removes |
| Status code correctness | `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Internal Server Error` |
| Consistent error shape | All error responses use a uniform JSON structure |
| Version prefix | All routes begin with `/api` to allow future versioning |
| Pagination support | Collection endpoints support paging, filtering, and sorting parameters |
| Statelessness | No session state is held on the server between requests |

**Standard error response shape:**

```
{
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Human-readable description",
  "timestamp": "2026-08-01T10:00:00Z"
}
```

---

## 8. Dependency Direction

Dependencies flow in one direction only: inward toward the domain.

```
Controller  ──▶  Service  ──▶  Repository  ──▶  Domain
     │                │               │
     │                │               └── only domain entities / interfaces
     │                └── may use multiple repositories
     └── maps DTOs ↔ service calls
```

**Rules:**
- The domain layer has no dependencies on any other layer.
- The repository layer depends only on the domain layer.
- The service layer depends on repositories and the domain layer.
- The controller layer depends on the service layer and DTOs.
- No layer reaches across or skips a layer.

---

## 9. Backend Package Structure

```
com.warehouse.inventory
│
├── controller
│   ├── ProductController
│   ├── CategoryController
│   ├── InventoryController
│   ├── MovementController
│   └── DashboardController
│
├── service
│   ├── ProductService
│   ├── CategoryService
│   ├── InventoryService
│   ├── MovementService
│   └── DashboardService
│
├── repository
│   ├── ProductRepository
│   ├── CategoryRepository
│   ├── InventoryRepository
│   └── MovementRepository
│
├── domain
│   ├── Product
│   ├── Category
│   ├── Location
│   ├── Inventory
│   ├── InventoryMovement
│   └── enums
│       ├── MovementType
│       └── StockStatus
│
├── dto
│   ├── request
│   │   ├── CreateProductRequest
│   │   ├── UpdateProductRequest
│   │   ├── CreateCategoryRequest
│   │   ├── ReceiveStockRequest
│   │   ├── TransferStockRequest
│   │   └── AdjustStockRequest
│   └── response
│       ├── ProductResponse
│       ├── CategoryResponse
│       ├── InventoryResponse
│       ├── MovementResponse
│       └── DashboardSummaryResponse
│
├── exception
│   ├── BusinessException
│   ├── ResourceNotFoundException
│   ├── DuplicateResourceException
│   ├── InsufficientStockException
│   └── GlobalExceptionHandler
│
└── config
    ├── SecurityConfig
    └── WebConfig
```

---

## 10. Frontend Folder Structure

```
src/
├── app/
│   │
│   ├── core/                          # Application-wide singletons
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   └── models/
│   │       └── api-error.model.ts
│   │
│   ├── shared/                        # Reusable presentational components, pipes, directives
│   │   ├── components/
│   │   │   ├── confirmation-dialog/
│   │   │   ├── data-table/
│   │   │   ├── filter-bar/
│   │   │   └── status-badge/
│   │   └── pipes/
│   │       └── stock-status.pipe.ts
│   │
│   ├── features/                      # One sub-folder per business domain
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── models/
│   │   │   └── dashboard-routing.module.ts
│   │   │
│   │   ├── products/
│   │   │   ├── pages/
│   │   │   │   ├── product-list/
│   │   │   │   ├── product-detail/
│   │   │   │   └── product-form/
│   │   │   ├── components/
│   │   │   │   └── product-card/
│   │   │   ├── services/
│   │   │   │   └── product.service.ts
│   │   │   ├── models/
│   │   │   │   └── product.model.ts
│   │   │   └── products-routing.module.ts
│   │   │
│   │   ├── categories/
│   │   │   └── (same structure as products)
│   │   │
│   │   ├── inventory/
│   │   │   ├── pages/
│   │   │   │   ├── inventory-overview/
│   │   │   │   └── inventory-movement-form/
│   │   │   ├── services/
│   │   │   │   └── inventory.service.ts
│   │   │   ├── models/
│   │   │   │   ├── inventory.model.ts
│   │   │   │   └── movement.model.ts
│   │   │   └── inventory-routing.module.ts
│   │   │
│   │   └── history/
│   │       ├── pages/
│   │       │   └── history-list/
│   │       ├── services/
│   │       │   └── history.service.ts
│   │       ├── models/
│   │       │   └── history-entry.model.ts
│   │       └── history-routing.module.ts
│   │
│   ├── app-routing.module.ts
│   ├── app.component.ts
│   └── app.module.ts
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
└── assets/
```

---

## 11. Architectural Principles Summary

| Principle | Rationale |
|---|---|
| Layered backend | Changes are isolated; each layer is independently testable |
| Feature-module frontend | Business domains stay cohesive; lazy loading reduces initial load time |
| DTOs for API boundary | Domain model changes do not break API consumers |
| Backend is the authority | Business rules are enforced in one place regardless of client |
| Dependency flows inward | Inner layers are stable; outer layers depend on them, not the reverse |
| No business logic in frontend | Frontend is a presentation layer; correctness is owned by the backend |
| Global exception handling | All failures produce consistent, safe API responses |
| REST without shortcuts | Predictable, resource-oriented API reduces integration ambiguity |
