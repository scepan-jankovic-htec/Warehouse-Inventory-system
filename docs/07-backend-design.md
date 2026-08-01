# Warehouse Inventory System — Backend Design

## 1. Document Purpose

This document describes the complete design of the Spring Boot backend for the Warehouse Inventory System. It defines the package structure, every class category and its responsibilities, validation strategy, exception handling, logging, configuration, dependency injection, and testing strategy.

This document does not contain Java code. It is the implementation reference for all backend work.

---

## 2. Technology Overview

| Concern | Technology |
|---|---|
| Runtime | Java |
| Framework | Spring Boot |
| Web layer | Spring MVC (REST) |
| Persistence | Spring Data JPA |
| Database | SQLite |
| Validation | Jakarta Bean Validation (via Spring Boot Starter Validation) |
| Security | Spring Security |
| Testing | JUnit 5, Mockito, Spring Boot Test |
| Build | Maven or Gradle (TBD at project setup) |

---

## 3. Package Structure

The root package is `com.warehouse.inventory`. All application code lives beneath it, organized by technical responsibility.

```
com.warehouse.inventory
│
├── controller          # HTTP layer — request/response mapping
├── service             # Business logic and workflow orchestration
├── repository          # Data access — queries and persistence
├── domain              # Entities, enums, value types
├── dto
│   ├── request         # Inbound API payloads
│   └── response        # Outbound API payloads
├── exception           # Custom exceptions and global handler
├── config              # Spring configuration beans
├── security            # Security filters, token handling, user details
└── mapper              # Domain ↔ DTO conversion
```

### Why this structure

Each package has a single, clear role. No cross-layer coupling is introduced. A developer can locate any concern — validation, error handling, data access — by knowing which package owns it. The domain package has no outward dependencies, making it the most stable layer.

---

## 4. Layer Descriptions

### 4.1 Controller Layer (`controller`)

**Responsibility:** Accept HTTP requests, delegate to the service layer, and return HTTP responses.

Controllers are the entry point for every API interaction. They own:

- Mapping URL paths and HTTP methods to service calls
- Deserializing JSON request bodies into request DTOs
- Serializing service return values into response DTOs
- Returning the correct HTTP status code for each outcome
- Triggering Bean Validation on incoming request DTOs via `@Valid`

Controllers contain **no business logic**. They do not make decisions about inventory state, validate business rules, or access the database. Every decision is delegated to the service layer.

**Classes:**

| Class | Serves |
|---|---|
| `CategoryController` | `/api/categories` |
| `ProductController` | `/api/products` |
| `LocationController` | `/api/locations` |
| `InventoryController` | `/api/inventory` |
| `MovementController` | `/api/inventory/movements` |
| `DashboardController` | `/api/dashboard` |
| `UserController` | `/api/users` |

---

### 4.2 Service Layer (`service`)

**Responsibility:** Contain all business logic, enforce all business rules, and orchestrate data access.

Services are the authoritative layer for correctness. They own:

- All business rule enforcement (non-negative stock, mandatory adjustment reason, duplicate SKU prevention, inactive resource restrictions)
- Coordination of multiple repository calls within a single operation
- Transactional boundaries — every operation that modifies data runs within a transaction
- Raising typed business exceptions when rules are violated
- Mapping domain entities to response DTOs for the controller

Services have no knowledge of HTTP. They neither read HTTP request objects nor produce HTTP response objects directly. They consume request DTOs and return response DTOs or domain objects.

**Classes:**

| Class | Responsibility |
|---|---|
| `CategoryService` | Category CRUD and deactivation logic |
| `ProductService` | Product CRUD, deactivation, and SKU uniqueness enforcement |
| `LocationService` | Location CRUD and deactivation logic |
| `InventoryService` | Inventory read queries and stock state evaluation |
| `MovementService` | Receive, transfer, and adjustment workflows — quantity updates and movement record creation |
| `DashboardService` | Aggregated metric computation for summary and stock-health endpoints |
| `UserService` | User CRUD, deactivation, and password handling |

---

### 4.3 Repository Layer (`repository`)

**Responsibility:** Provide data access operations for each domain entity.

Repositories are the only layer that directly accesses the database. They own:

- CRUD operations for all entities
- Custom queries for filtering, sorting, and pagination
- Aggregation queries required by dashboard and inventory services

Repositories have no knowledge of business rules. They execute the query they are asked to execute and return the result. Business decisions about that result belong to the service layer.

Each repository corresponds to one domain entity and extends the appropriate Spring Data JPA interface.

**Classes:**

| Class | Entity |
|---|---|
| `CategoryRepository` | `Category` |
| `ProductRepository` | `Product` |
| `LocationRepository` | `Location` |
| `InventoryRepository` | `Inventory` |
| `InventoryMovementRepository` | `InventoryMovement` |
| `UserRepository` | `AppUser` |

---

### 4.4 Domain Layer (`domain`)

**Responsibility:** Define the core data structures of the application.

The domain layer contains entities and enumerations. It has no dependencies on any other application package. It is the most stable part of the codebase — changes here have wide implications and must be considered carefully.

**Entities:**

| Entity | Maps to | Description |
|---|---|---|
| `Category` | `category` table | Product classification |
| `Product` | `product` table | Catalog item with SKU, name, and reorder threshold |
| `Location` | `location` table | Physical warehouse or store location |
| `Inventory` | `inventory` table | On-hand quantity per product-location pair |
| `InventoryMovement` | `inventory_movement` table | Immutable record of every stock change |
| `AppUser` | `app_user` table | User account with role |

**Enumerations (`domain/enums`):**

| Enum | Values | Usage |
|---|---|---|
| `MovementType` | `RECEIVE`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT` | Classifies inventory movements |
| `StockStatus` | `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK` | Derived stock state for display |
| `LocationType` | `WAREHOUSE`, `STORE` | Physical classification of a location |
| `UserRole` | `ADMIN`, `WAREHOUSE_OPERATOR`, `STORE_OPERATOR`, `MANAGER` | Role-based access control |

**Entity design rules:**

- All entities have a surrogate `Long id` as primary key.
- All entities include `createdAt` and `updatedAt` timestamps.
- Entities that support soft deletion include an `isActive` boolean field.
- `InventoryMovement` has no update path — it is written once and never modified.
- Entities are not exposed directly to the API. They are always mapped to DTOs before leaving the service layer.

---

### 4.5 DTO Layer (`dto`)

**Responsibility:** Define the API contract for inbound and outbound data.

DTOs separate the internal domain model from the external API surface. Domain entities may change their structure without breaking the API as long as the mapper layer is updated.

#### Request DTOs (`dto/request`)

Request DTOs carry data submitted by the client. They are annotated with Bean Validation constraints. They are never persisted directly.

| Class | Used by |
|---|---|
| `CreateCategoryRequest` | `POST /api/categories` |
| `UpdateCategoryRequest` | `PUT /api/categories/{id}` |
| `CreateProductRequest` | `POST /api/products` |
| `UpdateProductRequest` | `PUT /api/products/{id}` |
| `CreateLocationRequest` | `POST /api/locations` |
| `UpdateLocationRequest` | `PUT /api/locations/{id}` |
| `ReceiveStockRequest` | `POST /api/inventory/movements/receive` |
| `TransferStockRequest` | `POST /api/inventory/movements/transfer` |
| `AdjustStockRequest` | `POST /api/inventory/movements/adjust` |
| `CreateUserRequest` | `POST /api/users` |
| `UpdateUserRequest` | `PUT /api/users/{id}` |

#### Response DTOs (`dto/response`)

Response DTOs carry data returned to the client. They are constructed by the mapper layer from domain entities.

| Class | Returned by |
|---|---|
| `CategoryResponse` | Category endpoints |
| `ProductResponse` | Product endpoints |
| `ProductDetailResponse` | `GET /api/products/{id}` (includes inventory summary) |
| `LocationResponse` | Location endpoints |
| `InventoryResponse` | Inventory endpoints |
| `MovementResponse` | Movement endpoints |
| `TransferResponse` | `POST /api/inventory/movements/transfer` |
| `DashboardSummaryResponse` | `GET /api/dashboard/summary` |
| `StockHealthResponse` | `GET /api/dashboard/stock-health` |
| `UserResponse` | User endpoints |
| `PagedResponse<T>` | All paginated collection endpoints |
| `ApiErrorResponse` | All error responses |
| `FieldErrorResponse` | Nested inside `ApiErrorResponse` for field-level errors |

**Design rules:**

- No entity field is excluded from mapping accidentally. Every field in a response DTO is intentionally chosen.
- `password_hash` is never present in any response DTO.
- Nested summary objects (for example, `CategorySummary` embedded in `ProductResponse`) are used instead of exposing full nested objects.

---

### 4.6 Mapper Layer (`mapper`)

**Responsibility:** Convert domain entities to response DTOs and request DTOs to domain entities.

Mappers are stateless utility classes. They perform field-by-field conversion with no business logic. Every conversion is explicit and auditable.

**Classes:**

| Class | Converts |
|---|---|
| `CategoryMapper` | `Category` ↔ `CategoryResponse`, `CreateCategoryRequest` → `Category` |
| `ProductMapper` | `Product` ↔ `ProductResponse` / `ProductDetailResponse` |
| `LocationMapper` | `Location` ↔ `LocationResponse` |
| `InventoryMapper` | `Inventory` ↔ `InventoryResponse` |
| `MovementMapper` | `InventoryMovement` ↔ `MovementResponse` |
| `UserMapper` | `AppUser` ↔ `UserResponse` |

**Why a separate mapper package:**

Keeping mapping logic out of the service layer keeps services focused on business decisions. Keeping it out of controllers keeps controllers focused on HTTP concerns. Mappers are the only place where entity structure and DTO structure are compared, making contract changes easy to locate and audit.

---

## 5. Validation

### 5.1 Bean Validation on Request DTOs

All request DTOs are annotated with Bean Validation constraints. These are evaluated automatically when a controller method parameter is annotated with `@Valid`. If any constraint fails, a `MethodArgumentNotValidException` is thrown and handled by the global exception handler.

**Constraints used:**

| Constraint | Applied to |
|---|---|
| `@NotBlank` | All required string fields (name, SKU, reason, etc.) |
| `@NotNull` | All required non-string fields (IDs, quantities) |
| `@Size(max = N)` | All string fields with maximum length defined in the database design |
| `@Min(value = 0)` | `reorderThreshold` |
| `@Min(value = 1)` | `quantity` fields for receive and transfer |
| `@NotZero` (custom) | `quantityDelta` in `AdjustStockRequest` |
| `@Email` | `email` field in user requests |
| `@Pattern` | `role`, `type`, `movementType` fields where enum-level validation is needed |

### 5.2 Business Validation in the Service Layer

Constraints that require database state or business context are enforced in the service layer, not via Bean Validation. These validations happen after structural validation passes.

| Validation | Layer | Throws |
|---|---|---|
| SKU uniqueness | `ProductService` | `DuplicateResourceException` |
| Category name uniqueness | `CategoryService` | `DuplicateResourceException` |
| Location name uniqueness | `LocationService` | `DuplicateResourceException` |
| Category must be active for product assignment | `ProductService` | `InactiveResourceException` |
| Product must be active for inventory operations | `MovementService` | `InactiveResourceException` |
| Location must be active for inventory operations | `MovementService` | `InactiveResourceException` |
| Source ≠ destination in transfer | `MovementService` | `InvalidOperationException` |
| Sufficient stock at source for transfer | `MovementService` | `InsufficientStockException` |
| Adjustment must not result in negative stock | `MovementService` | `InsufficientStockException` |
| `dateFrom` ≤ `dateTo` for history filter | `MovementService` | `InvalidOperationException` |

### 5.3 Validation Layering Summary

```
Request arrives
      │
      ▼
Bean Validation (@Valid on controller parameter)
      │ fails → 400 Bad Request (fieldErrors populated)
      │ passes
      ▼
Service Layer Business Validation
      │ fails → 409 Conflict / 422 Unprocessable Entity
      │ passes
      ▼
Repository / Database Constraint (safety net)
```

---

## 6. Exception Handling

### 6.1 Custom Exception Hierarchy

All business exceptions extend a common base class `BusinessException`. This allows the global handler to catch all business failures through a single catch point and ensures no raw exceptions leak to the API response.

| Exception | HTTP Status | Error Code | Scenario |
|---|---|---|---|
| `ResourceNotFoundException` | 404 | `RESOURCE_NOT_FOUND` | Entity ID not found |
| `DuplicateResourceException` | 409 | `DUPLICATE_RESOURCE` | Unique constraint violation (SKU, name, email) |
| `InsufficientStockException` | 422 | `INSUFFICIENT_STOCK` | Transfer or adjustment would result in negative quantity |
| `InactiveResourceException` | 422 | `INACTIVE_RESOURCE` | Operation on deactivated product, location, or category |
| `InvalidOperationException` | 422 | `INVALID_TRANSFER` / `ALREADY_INACTIVE` | Same-location transfer, already inactive, date range invalid |
| `BusinessException` (base) | 422 | configurable | Catch-all for unclassified business rule violations |

### 6.2 Global Exception Handler

A single `GlobalExceptionHandler` class annotated with `@RestControllerAdvice` intercepts all exceptions raised during request processing. It translates each exception type to the standard `ApiErrorResponse` shape defined in the API specification.

**Exceptions handled:**

| Exception Type | Translated to |
|---|---|
| `MethodArgumentNotValidException` | 400 with populated `fieldErrors` |
| `ResourceNotFoundException` | 404 |
| `DuplicateResourceException` | 409 |
| `InsufficientStockException` | 422 |
| `InactiveResourceException` | 422 |
| `InvalidOperationException` | 422 |
| `AccessDeniedException` (Spring Security) | 403 |
| `AuthenticationException` (Spring Security) | 401 |
| `HttpMessageNotReadableException` | 400 (malformed JSON body) |
| `MethodArgumentTypeMismatchException` | 400 (wrong type for path/query parameter) |
| `Exception` (catch-all) | 500 (no internal detail in response body) |

**Rules for the global handler:**

- All responses use the `ApiErrorResponse` shape exactly as defined in the API specification.
- The `500` handler logs the full exception with stack trace but returns only a generic message to the client.
- No raw Java exception message is ever included in a response body.
- Timestamps in error responses are UTC ISO-8601.

---

## 7. Security

### 7.1 Security Package (`security`)

**Responsibility:** Authentication, authorization, token processing, and user context loading.

**Classes:**

| Class | Responsibility |
|---|---|
| `JwtTokenProvider` | Generates and validates JWT tokens |
| `JwtAuthenticationFilter` | Intercepts requests, validates the `Authorization` header, and populates the security context |
| `UserDetailsServiceImpl` | Loads `AppUser` by username for Spring Security authentication |
| `SecurityConfig` | Defines HTTP security rules, CORS policy, and filter chain configuration |

### 7.2 Authorization Rules

Authorization is enforced at the service method level using Spring Security method-level annotations. Controllers do not contain role checks.

| Operation | Minimum Required Role |
|---|---|
| All read operations (GET) | Any authenticated user |
| Create / Update / Deactivate / Activate categories, products, locations, users | `ADMIN` |
| Receive, Transfer, Adjust stock | `ADMIN` or `WAREHOUSE_OPERATOR` |

### 7.3 User Context in Movements

Every inventory movement records the actor who performed it. The service layer resolves the currently authenticated user from the Spring Security context and associates it with each `InventoryMovement` record at write time.

---

## 8. Logging

### 8.1 Logging Strategy

The backend uses the SLF4J API backed by Logback (provided by Spring Boot's default configuration). All log statements use SLF4J interfaces exclusively — no direct reference to Logback in application code.

### 8.2 What to Log

| Event | Level | Layer |
|---|---|---|
| Application startup and configuration summary | `INFO` | `config` / `@SpringBootApplication` |
| Incoming requests (method, path, actor) | `INFO` | Filter or interceptor |
| Successful inventory movement operations | `INFO` | `MovementService` |
| Business rule violations (expected failures) | `WARN` | Service layer |
| Validation failures | `WARN` | Global exception handler |
| Unexpected exceptions (unhandled) | `ERROR` | Global exception handler |
| Security events (authentication failure, access denied) | `WARN` | Security layer |
| Repository-level query performance issues | `DEBUG` | Repository |

### 8.3 What Not to Log

- Passwords or password hashes at any level
- Raw JWT token values
- Full request bodies containing sensitive fields
- Stack traces in HTTP response bodies

### 8.4 Correlation

Each request is assigned a correlation ID. The correlation ID is:

- Generated at the entry point of each request (filter or interceptor)
- Included in all log entries for the duration of that request via the MDC (Mapped Diagnostic Context)
- Returned in the response header `X-Correlation-Id`

This enables end-to-end request tracing across log entries.

---

## 9. Configuration

### 9.1 Configuration Package (`config`)

**Responsibility:** Define Spring beans and application-wide configuration that does not belong to a specific business layer.

**Classes:**

| Class | Responsibility |
|---|---|
| `SecurityConfig` | Spring Security HTTP configuration, CORS, JWT filter registration |
| `WebConfig` | MVC configuration — CORS global settings, message converters |
| `JpaConfig` | JPA/Hibernate settings specific to SQLite (dialect, DDL behavior) |
| `OpenApiConfig` | Springdoc OpenAPI / Swagger UI configuration (if included) |

### 9.2 Application Properties

Configuration values are defined in `application.properties` or `application.yml` and follow the principle of externalized configuration. Environment-specific values (for example, database path, JWT secret, token expiry) are not hardcoded.

**Key property groups:**

| Group | Examples |
|---|---|
| Database | `spring.datasource.url`, `spring.datasource.driver-class-name` |
| JPA | `spring.jpa.hibernate.ddl-auto`, `spring.jpa.database-platform` |
| JWT | `app.jwt.secret`, `app.jwt.expiration-ms` |
| CORS | `app.cors.allowed-origins` |
| Logging | `logging.level.com.warehouse.inventory` |

### 9.3 Environment Profiles

Spring profiles separate configuration by environment:

| Profile | Purpose |
|---|---|
| `default` | Local development |
| `test` | Automated test execution (in-memory SQLite or H2) |
| `prod` | Production deployment |

---

## 10. Dependency Injection

Spring Boot's IoC container manages all dependencies. The following conventions apply throughout the codebase:

- **Constructor injection is the only permitted injection style.** Field injection (`@Autowired` on fields) is not used. Constructor injection makes dependencies explicit, supports immutability, and is more testable.
- All service classes are annotated with `@Service`.
- All repository interfaces are annotated with `@Repository` (or extend Spring Data interfaces which imply it).
- All controller classes are annotated with `@RestController`.
- Configuration beans are annotated with `@Configuration` and `@Bean`.
- No circular dependencies are permitted. If a circular dependency appears, it indicates a design problem that must be resolved by restructuring responsibilities.

---

## 11. Transaction Management

- Transaction management uses Spring's declarative `@Transactional` annotation.
- Transactions are applied at the **service layer only**. Controllers and repositories are not transactional directly.
- Operations that modify multiple tables in a single business action (for example, a transfer that updates two inventory rows and creates two movement records) must run within a single transaction to ensure atomicity.
- Read-only service methods are annotated with `@Transactional(readOnly = true)` to allow performance optimizations.
- Transaction rollback on unchecked exceptions is the default behavior and is not overridden.

---

## 12. Testing Strategy

### 12.1 Coverage Target

A minimum of **70% unit test coverage** is required across all backend code, as defined in NFR-TEST-001. Business-critical paths must be explicitly covered.

### 12.2 Unit Tests

Unit tests cover individual classes in isolation. External dependencies (repositories, other services) are replaced with mocks.

**Test targets and focus areas:**

| Layer | Test Focus |
|---|---|
| `Service` | All business rules, edge cases, exception flows, quantity calculations |
| `Controller` | HTTP status codes, request/response mapping, `@Valid` trigger behavior |
| `Mapper` | Correct field-by-field mapping between entity and DTO |
| `Exception Handler` | Correct status codes and response shapes for each exception type |
| `JwtTokenProvider` | Token generation, validation, and expiry |

**Framework:** JUnit 5 with Mockito for mocking.

### 12.3 Integration Tests

Integration tests verify that the full Spring application context starts correctly and that wired components interact as expected.

**Test targets:**

| Scope | What Is Tested |
|---|---|
| Repository layer | Queries against an in-memory test database (SQLite or H2 in compatibility mode) |
| Full request-response cycle | `@SpringBootTest` with `MockMvc` for end-to-end HTTP-level assertions without a running server |

**Framework:** Spring Boot Test, `@DataJpaTest` for repository tests, `MockMvc` for controller integration tests.

### 12.4 Test Design Rules

- Tests must be independent. No test depends on the execution order of another test.
- Tests must be deterministic. Time-sensitive tests use a fixed or injected clock.
- No fake or stub implementations may be used in production code paths.
- Each test class focuses on one subject. Shared test helpers are extracted to test utility classes.
- The `test` Spring profile is active during all test runs and configures an isolated test database.

### 12.5 Priority Test Coverage Areas

The following areas must have explicit unit tests regardless of overall coverage metrics, per NFR-TEST-002:

1. `MovementService` — receive, transfer, and adjustment quantity logic
2. `MovementService` — negative stock prevention on transfer and adjustment
3. `MovementService` — mandatory reason enforcement for adjustments
4. `ProductService` — SKU uniqueness enforcement
5. `MovementService` — same-location transfer rejection
6. All service methods — behavior when operating on inactive resources
7. `GlobalExceptionHandler` — response shape for each exception type
8. `JwtTokenProvider` — token validation and expiry behavior

---

## 13. Summary of Package Responsibilities

| Package | Owns | Does Not Own |
|---|---|---|
| `controller` | HTTP mapping, status codes, `@Valid` trigger | Business logic, DB access |
| `service` | Business rules, transactions, orchestration | HTTP concerns, SQL queries |
| `repository` | Data access, queries, pagination | Business rules, HTTP concerns |
| `domain` | Entities, enums, value types | Dependencies on any other package |
| `dto/request` | Inbound payload structure, Bean Validation constraints | Business logic |
| `dto/response` | Outbound payload structure | Business logic |
| `mapper` | Entity ↔ DTO conversion | Business logic, DB access, HTTP concerns |
| `exception` | Exception types, global handler | Domain logic, data access |
| `security` | Authentication, authorization, JWT | Business domain logic |
| `config` | Spring bean configuration | Business domain logic, data access |
