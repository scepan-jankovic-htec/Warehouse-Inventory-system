# Warehouse Inventory System — Development Plan

## 1. Document Purpose

This document is the step-by-step implementation roadmap for the Warehouse Inventory System. It breaks the project into three sequential phases — Database, Backend, Frontend — each divided into small, independently completable tasks sized for a single AI-assisted implementation session.

Every task specifies its goal, description, dependencies, expected outcome, verification steps, and testing requirements.

---

## 2. Implementation Phases

| Phase | Area | Focus |
|---|---|---|
| Phase 1 | Database | SQLite schema, migrations, seed data |
| Phase 2 | Backend | Spring Boot API, business logic, security |
| Phase 3 | Frontend | Angular 21 SPA, services, components, forms |

---

# Phase 1 — SQLite Database

---

## TASK DB-01: Project Repository and Build Setup

**Goal:** Create the project repository structure and configure the build tool.

**Description:**  
Initialize the project repository with a root-level layout that separates backend and frontend source trees. Configure the build tool (Maven or Gradle) for the backend Spring Boot project. Verify that the project compiles and the Spring Boot application starts.

**Dependencies:** None

**Expected Outcome:**
- Repository has `backend/` and `frontend/` directories at the root.
- The Spring Boot application starts without errors.
- Build produces a runnable artifact.

**Verification:**
- Running the backend build command produces a successful build.
- The application starts and the Spring Boot banner appears in the console.

**Testing:** None at this stage.

---

## TASK DB-02: SQLite Dependency and Data Source Configuration

**Goal:** Configure the Spring Boot backend to connect to a SQLite database file.

**Description:**  
Add the SQLite JDBC driver dependency to the build file. Configure `application.properties` with the datasource URL pointing to a local SQLite file. Configure JPA settings for SQLite compatibility. Enable foreign key enforcement at the connection level via a datasource post-processor or connection initialization script.

**Dependencies:** DB-01

**Expected Outcome:**
- The application starts and connects to the SQLite file without errors.
- Foreign key enforcement (`PRAGMA foreign_keys = ON`) is active for every connection.

**Verification:**
- Application logs show a successful datasource connection.
- A SQLite file is created at the configured path on first startup.

**Testing:**
- Confirm datasource bean is loaded correctly in the Spring context via an integration test.

---

## TASK DB-03: Database Migration Tool Setup

**Goal:** Configure a database migration tool to manage schema changes.

**Description:**  
Integrate Flyway or Liquibase into the Spring Boot project. Configure it to run migrations from a defined location on application startup. Create the initial migration baseline file (empty, version 1) to establish the migration history table.

**Dependencies:** DB-02

**Expected Outcome:**
- Migration tool runs on startup and creates its history table in the SQLite file.
- A baseline migration file exists in the configured migrations directory.

**Verification:**
- Application logs show migration execution output.
- The SQLite file contains the migration history table.

**Testing:** None beyond startup verification.

---

## TASK DB-04: Create `category` Table Migration

**Goal:** Create the `category` table with all columns, constraints, and indexes.

**Description:**  
Write a migration file that creates the `category` table as defined in `docs/05-database-design.md` (section 4.1). Include all columns, NOT NULL constraints, UNIQUE constraint on `name`, CHECK constraint on `is_active`, DEFAULT values, and the two indexes `idx_category_name` and `idx_category_is_active`.

**Dependencies:** DB-03

**Expected Outcome:**
- The `category` table exists in the SQLite database.
- All constraints and indexes are present.

**Verification:**
- Application starts cleanly and migration log shows the migration applied.
- Manually inspect the SQLite file to confirm table structure and indexes.

**Testing:** None at this stage.

---

## TASK DB-05: Create `location` Table Migration

**Goal:** Create the `location` table with all columns, constraints, and indexes.

**Description:**  
Write a migration file that creates the `location` table as defined in `docs/05-database-design.md` (section 4.3). Include CHECK constraint for `type` values (`WAREHOUSE`, `STORE`), UNIQUE on `name`, and all three indexes.

**Dependencies:** DB-03

**Expected Outcome:**
- The `location` table exists with all constraints and indexes.

**Verification:**
- Migration log shows successful execution.
- Table structure is inspectable in the SQLite file.

**Testing:** None at this stage.

---

## TASK DB-06: Create `app_user` Table Migration

**Goal:** Create the `app_user` table with all columns, constraints, and indexes.

**Description:**  
Write a migration file that creates the `app_user` table as defined in `docs/05-database-design.md` (section 4.6). Include UNIQUE constraints on `username` and `email`, CHECK constraint on `role` values, and all three indexes.

**Dependencies:** DB-03

**Expected Outcome:**
- The `app_user` table exists with all constraints and indexes.

**Verification:**
- Migration log shows successful execution.

**Testing:** None at this stage.

---

## TASK DB-07: Create `product` Table Migration

**Goal:** Create the `product` table with all columns, constraints, and indexes.

**Description:**  
Write a migration file that creates the `product` table as defined in `docs/05-database-design.md` (section 4.2). Include the FOREIGN KEY reference to `category(id)`, UNIQUE on `sku`, CHECK on `reorder_threshold` and `is_active`, and all four indexes.

**Dependencies:** DB-04 (category must exist first due to foreign key)

**Expected Outcome:**
- The `product` table exists with all constraints, foreign key, and indexes.

**Verification:**
- Migration log shows successful execution.
- Foreign key from `product.category_id` to `category.id` is present.

**Testing:** None at this stage.

---

## TASK DB-08: Create `inventory` Table Migration

**Goal:** Create the `inventory` table with all columns, constraints, and indexes.

**Description:**  
Write a migration file that creates the `inventory` table as defined in `docs/05-database-design.md` (section 4.4). Include FOREIGN KEY references to `product(id)` and `location(id)`, the composite UNIQUE constraint on `(product_id, location_id)`, CHECK on `quantity_on_hand >= 0`, and all three indexes.

**Dependencies:** DB-07, DB-05

**Expected Outcome:**
- The `inventory` table exists with all constraints, foreign keys, and indexes.
- The `CHECK (quantity_on_hand >= 0)` constraint is present as a safety net for the non-negative stock business rule.

**Verification:**
- Migration log shows successful execution.
- Composite unique constraint and CHECK constraint are present.

**Testing:** None at this stage.

---

## TASK DB-09: Create `inventory_movement` Table Migration

**Goal:** Create the `inventory_movement` table with all columns, constraints, and indexes.

**Description:**  
Write a migration file that creates the `inventory_movement` table as defined in `docs/05-database-design.md` (section 4.5). Include FOREIGN KEY references to `product(id)`, `location(id)`, and `app_user(id)`, the self-referencing FK on `transfer_counterpart_id`, CHECK constraints on `movement_type` values and `quantity_delta != 0`, and all six indexes including the composite one.

**Dependencies:** DB-07, DB-05, DB-06

**Expected Outcome:**
- The `inventory_movement` table exists with all constraints, foreign keys, and indexes.
- The self-referencing FK for transfer linkage is present.

**Verification:**
- Migration log shows successful execution.
- All six indexes are present.

**Testing:** None at this stage.

---

## TASK DB-10: Database Seed Data Migration

**Goal:** Insert initial reference data required to start using the application.

**Description:**  
Write a seed migration file that inserts:
- One default `ADMIN` user account (with a bcrypt-hashed password).
- At least two sample categories.
- At least two sample locations (one WAREHOUSE, one STORE).

This seed data is for development and test environments only. Production deployments may use a separate seed file or none at all.

**Dependencies:** DB-04, DB-05, DB-06

**Expected Outcome:**
- The database contains a usable admin account and initial reference data after startup.

**Verification:**
- Query the tables and confirm the seeded rows are present.
- Confirm the admin password_hash is not plaintext.

**Testing:** None at this stage.

---

# Phase 2 — Spring Boot Backend

---

## TASK BE-01: Domain Enumerations

**Goal:** Define all domain enumerations as Java enum types.

**Description:**  
Create the four enumerations in the `com.warehouse.inventory.domain.enums` package as specified in `docs/07-backend-design.md` (section 4.4):
- `MovementType` — `RECEIVE`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT`
- `StockStatus` — `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`
- `LocationType` — `WAREHOUSE`, `STORE`
- `UserRole` — `ADMIN`, `WAREHOUSE_OPERATOR`, `STORE_OPERATOR`, `MANAGER`

**Dependencies:** DB-01

**Expected Outcome:**
- All four enums exist in the correct package.
- The application compiles.

**Verification:**
- Project compiles without errors.

**Testing:** None for pure enum definitions.

---

## TASK BE-02: JPA Entities — Category and Location

**Goal:** Create the `Category` and `Location` JPA entities.

**Description:**  
Create JPA entity classes for `Category` and `Location` in the `com.warehouse.inventory.domain` package. Map each field to its database column as defined in `docs/05-database-design.md`. Apply appropriate JPA annotations, column constraints, and enum type mappings. Include `createdAt` and `updatedAt` fields with automatic population via JPA lifecycle callbacks or an auditing mechanism.

**Dependencies:** BE-01, DB-04, DB-05

**Expected Outcome:**
- `Category` and `Location` entity classes exist and map correctly to their tables.
- Application starts without JPA validation errors.

**Verification:**
- Application starts successfully.
- JPA schema validation (if enabled) passes.

**Testing:** None at this stage.

---

## TASK BE-03: JPA Entity — AppUser

**Goal:** Create the `AppUser` JPA entity.

**Description:**  
Create the `AppUser` entity in the domain package. Map `role` to the `UserRole` enum using a string column mapping. Include `isActive`, `createdAt`, and `updatedAt`. Do not include any authentication logic in the entity itself.

**Dependencies:** BE-01, DB-06

**Expected Outcome:**
- `AppUser` entity class exists and maps correctly to `app_user`.

**Verification:**
- Application starts without JPA mapping errors.

**Testing:** None at this stage.

---

## TASK BE-04: JPA Entity — Product

**Goal:** Create the `Product` JPA entity with its `Category` relationship.

**Description:**  
Create the `Product` entity in the domain package. Map the many-to-one relationship to `Category` using `@ManyToOne` with `@JoinColumn`. Map all fields as defined in `docs/05-database-design.md`.

**Dependencies:** BE-02

**Expected Outcome:**
- `Product` entity class exists and maps correctly to `product`.
- The `category` relationship is navigable.

**Verification:**
- Application starts without JPA errors.

**Testing:** None at this stage.

---

## TASK BE-05: JPA Entity — Inventory

**Goal:** Create the `Inventory` JPA entity with its product and location relationships.

**Description:**  
Create the `Inventory` entity. Map many-to-one relationships to both `Product` and `Location`. Map the `quantityOnHand` field. Include `createdAt` and `updatedAt`.

**Dependencies:** BE-04, BE-02

**Expected Outcome:**
- `Inventory` entity exists and maps to its table correctly.

**Verification:**
- Application starts without JPA errors.

**Testing:** None at this stage.

---

## TASK BE-06: JPA Entity — InventoryMovement

**Goal:** Create the `InventoryMovement` JPA entity.

**Description:**  
Create the `InventoryMovement` entity. Map many-to-one relationships to `Product`, `Location`, and `AppUser`. Map `movementType` to the `MovementType` enum. Map `transferCounterpartId` as a self-referencing optional association (or a plain `Long` field). Include `performedAt`. This entity has no `updatedAt` — it is immutable after creation.

**Dependencies:** BE-04, BE-02, BE-03

**Expected Outcome:**
- `InventoryMovement` entity exists and maps correctly.

**Verification:**
- Application starts without JPA errors.

**Testing:** None at this stage.

---

## TASK BE-07: Repository Interfaces

**Goal:** Create all Spring Data JPA repository interfaces.

**Description:**  
Create the six repository interfaces in `com.warehouse.inventory.repository` as specified in `docs/07-backend-design.md` (section 4.3):
- `CategoryRepository`
- `ProductRepository`
- `LocationRepository`
- `InventoryRepository`
- `InventoryMovementRepository`
- `UserRepository`

Each interface extends `JpaRepository`. Add method signatures for custom queries that are required by service operations (for example: `findBySkuIgnoreCase`, `findByProductIdAndLocationId`, `existsByName`). Custom JPQL queries will be defined in a subsequent task.

**Dependencies:** BE-02 through BE-06

**Expected Outcome:**
- All six repository interfaces exist and are recognized by Spring Data JPA.
- Application starts without errors.

**Verification:**
- Application context loads repositories without errors.

**Testing:** None at this stage.

---

## TASK BE-08: Response DTOs

**Goal:** Create all response DTO classes.

**Description:**  
Create all response DTO classes in `com.warehouse.inventory.dto.response` as listed in `docs/07-backend-design.md` (section 4.5):
`CategoryResponse`, `ProductResponse`, `ProductDetailResponse`, `LocationResponse`, `InventoryResponse`, `MovementResponse`, `TransferResponse`, `DashboardSummaryResponse`, `StockHealthResponse`, `UserResponse`, `PagedResponse<T>`, `ApiErrorResponse`, `FieldErrorResponse`.

Fields must match the API contract defined in `docs/06-api-specification.md`. Use records or immutable classes.

**Dependencies:** BE-01

**Expected Outcome:**
- All response DTOs exist with fields matching the API specification.

**Verification:**
- Project compiles without errors.

**Testing:** None at this stage.

---

## TASK BE-09: Request DTOs with Bean Validation

**Goal:** Create all request DTO classes with Bean Validation annotations.

**Description:**  
Create all request DTO classes in `com.warehouse.inventory.dto.request` as listed in `docs/07-backend-design.md` (section 4.5). Apply Bean Validation constraints as defined in `docs/07-backend-design.md` (section 5.1): `@NotBlank`, `@NotNull`, `@Size`, `@Min`, `@Email`, and `@Pattern` where appropriate. The `reason` field in `AdjustStockRequest` must be `@NotBlank`.

**Dependencies:** BE-01

**Expected Outcome:**
- All request DTOs exist with appropriate validation constraints.

**Verification:**
- Project compiles without errors.

**Testing:**
- Unit tests confirming validation constraints on each request DTO (use a validator manually or through a Spring context slice).

---

## TASK BE-10: Custom Exception Classes

**Goal:** Create the complete custom exception hierarchy.

**Description:**  
Create all exception classes in `com.warehouse.inventory.exception` as defined in `docs/07-backend-design.md` (section 6.1):
- `BusinessException` (base class)
- `ResourceNotFoundException`
- `DuplicateResourceException`
- `InsufficientStockException`
- `InactiveResourceException`
- `InvalidOperationException`

Each exception should accept a message string. `ResourceNotFoundException` should also accept the resource name and ID for consistent messaging.

**Dependencies:** DB-01

**Expected Outcome:**
- All exception classes exist in the correct package.
- Exception hierarchy is correctly established.

**Verification:**
- Project compiles without errors.

**Testing:** None for exception class structure.

---

## TASK BE-11: Global Exception Handler

**Goal:** Create the `GlobalExceptionHandler` to translate all exceptions to the standard API error response.

**Description:**  
Create `GlobalExceptionHandler` in the `exception` package, annotated with `@RestControllerAdvice`. Implement handlers for every exception type listed in `docs/07-backend-design.md` (section 6.2). Each handler must produce an `ApiErrorResponse` with the correct status, error code, message, timestamp, and `fieldErrors` where applicable. The catch-all `Exception` handler must log the full stack trace but return only a generic message.

**Dependencies:** BE-08, BE-10

**Expected Outcome:**
- Every defined exception type maps to its correct HTTP status code and error response shape.
- No raw exception messages are exposed in any error response.

**Verification:**
- Project compiles without errors.

**Testing:**
- Unit tests for the handler: for each exception type, assert the correct status code and `error` code in the response body.
- Assert that the `500` handler does not include the exception message in the response.

---

## TASK BE-12: Mapper Classes

**Goal:** Create all mapper classes for domain ↔ DTO conversion.

**Description:**  
Create the six mapper classes in `com.warehouse.inventory.mapper` as defined in `docs/07-backend-design.md` (section 4.6). Each mapper converts between entity and DTO via explicit field-by-field mapping. No business logic belongs in mappers. `UserMapper` must never include `passwordHash` in any response.

**Dependencies:** BE-02 through BE-06, BE-08

**Expected Outcome:**
- All mappers exist and produce correctly populated DTOs from entities.

**Verification:**
- Project compiles without errors.

**Testing:**
- Unit tests for each mapper: given a fully populated entity, assert every response DTO field is mapped correctly.
- For `UserMapper`, assert that `passwordHash` is absent from `UserResponse`.

---

## TASK BE-13: Security Configuration and JWT Infrastructure

**Goal:** Configure Spring Security and implement JWT token generation and validation.

**Description:**  
Create the `SecurityConfig` class in the `config` package. Configure the security filter chain to permit `/api/auth/**` and require authentication for all other endpoints. Disable CSRF (stateless REST API). Create `JwtTokenProvider` in the `security` package for generating and validating JWT tokens. Create `JwtAuthenticationFilter` to extract and validate tokens from the `Authorization` header and populate the `SecurityContext`. Create `UserDetailsServiceImpl` to load `AppUser` by username for Spring Security.

**Dependencies:** BE-03, BE-07

**Expected Outcome:**
- Unauthenticated requests to protected endpoints return `401`.
- A valid JWT token in the `Authorization` header grants access.

**Verification:**
- A request without a token to `GET /api/products` returns `401`.
- Application starts without security configuration errors.

**Testing:**
- Unit tests for `JwtTokenProvider`: token generation, parsing, expiry validation.
- Integration test confirming `401` for unauthenticated requests.

---

## TASK BE-14: Authentication Endpoint

**Goal:** Implement login endpoint that returns a JWT token.

**Description:**  
Create a `POST /api/auth/login` endpoint (outside the secured filter chain). Accept username and password. Authenticate via Spring Security's `AuthenticationManager`. On success, return a JWT token and the authenticated user's role. On failure, return `401`. This endpoint is not listed in the main API specification resource table but is required as a prerequisite for all other endpoints.

**Dependencies:** BE-13

**Expected Outcome:**
- A valid username/password pair returns a JWT token.
- Invalid credentials return `401`.

**Verification:**
- Test login with the seeded admin credentials from DB-10.
- Use the returned token in a subsequent request to confirm authentication works end-to-end.

**Testing:**
- Integration test for valid credentials (expect `200` with token).
- Integration test for invalid credentials (expect `401`).

---

## TASK BE-15: Category Service and Controller

**Goal:** Implement all category endpoints.

**Description:**  
Implement `CategoryService` with: `findAll` (with filtering, sorting, pagination), `findById`, `create`, `update`, `deactivate`, `activate`. Enforce category name uniqueness in `create` and `update`. Raise `ResourceNotFoundException` for unknown IDs. Raise `DuplicateResourceException` for duplicate names. Raise `InvalidOperationException` when deactivating an already-inactive category.

Implement `CategoryController` mapping all six endpoints defined in `docs/06-api-specification.md` (section 6.1). Apply `@Valid` on request body parameters. Return correct HTTP status codes.

**Dependencies:** BE-07, BE-09, BE-12, BE-13

**Expected Outcome:**
- All category endpoints (`GET`, `POST`, `PUT`, `PATCH` deactivate/activate) work as specified.
- Validation and business rules return correct error responses.

**Verification:**
- Manual API test: create a category, list it, update it, deactivate it.
- Duplicate name attempt returns `409`.
- Unknown ID returns `404`.

**Testing:**
- Unit tests for `CategoryService`: create success, duplicate name, deactivate, activate, not found.
- Integration tests for `CategoryController`: `201` on create, `409` on duplicate, `400` on blank name, `404` on unknown ID.

---

## TASK BE-16: Location Service and Controller

**Goal:** Implement all location endpoints.

**Description:**  
Implement `LocationService` with CRUD, deactivation, and activation. Enforce location name uniqueness. Raise appropriate exceptions for business rule violations.

Implement `LocationController` for all six endpoints defined in `docs/06-api-specification.md` (section 6.3).

**Dependencies:** BE-07, BE-09, BE-12, BE-13

**Expected Outcome:**
- All location endpoints work as specified.

**Verification:**
- Create a WAREHOUSE and a STORE location. List and filter by type.

**Testing:**
- Unit tests for `LocationService`: create, duplicate name, deactivate, not found.
- Controller integration tests: `201`, `409`, `400`, `404`.

---

## TASK BE-17: Product Service and Controller

**Goal:** Implement all product endpoints.

**Description:**  
Implement `ProductService` with CRUD, deactivation, and activation. Enforce SKU uniqueness. Reject assignment to inactive categories. Raise `DuplicateResourceException` for duplicate SKU. Raise `InactiveResourceException` when assigning to a deactivated category. SKU is immutable — the update operation does not accept or process a new SKU value.

Implement `ProductController` for all six endpoints defined in `docs/06-api-specification.md` (section 6.2). The `GET /api/products/{id}` response includes current inventory by location (fetched from `InventoryRepository`).

**Dependencies:** BE-07, BE-09, BE-12, BE-15

**Expected Outcome:**
- All product endpoints work as specified.
- Duplicate SKU returns `409`.
- Inactive category assignment returns `422`.

**Verification:**
- Create a product, list it, retrieve its detail (with empty inventory), update it, deactivate it.

**Testing:**
- Unit tests for `ProductService`: create, duplicate SKU, inactive category, deactivate, not found.
- Controller integration tests: `201`, `409`, `422`, `404`.

---

## TASK BE-18: Inventory Query Service and Controller

**Goal:** Implement inventory read endpoints.

**Description:**  
Implement `InventoryService.findAll` supporting filtering by `locationId`, `productId`, `categoryId`, `stockStatus`, and keyword search on product name/SKU. Support sorting by `productName`, `sku`, `locationName`, `quantityOnHand`, `stockStatus`. Support pagination.

`StockStatus` is derived by comparing `quantityOnHand` to `reorderThreshold`:
- `OUT_OF_STOCK` when `quantityOnHand == 0`
- `LOW_STOCK` when `0 < quantityOnHand <= reorderThreshold`
- `IN_STOCK` when `quantityOnHand > reorderThreshold`

Implement `InventoryController` for `GET /api/inventory` and `GET /api/inventory/{productId}/{locationId}`.

**Dependencies:** BE-07, BE-08, BE-12, BE-17

**Expected Outcome:**
- Inventory list is filterable and sortable.
- Stock status is derived correctly.
- `404` is returned for an unknown product-location combination.

**Verification:**
- With seed data and at least one inventory record, confirm filtering by `locationId` returns only that location's inventory. Confirm `stockStatus` is correctly derived.

**Testing:**
- Unit tests for `InventoryService.findAll`: stock status derivation for all three states; filter correctness.
- Controller integration tests: `200` with correct response shape, `404` for unknown combination.

---

## TASK BE-19: Inventory Movement Service — Receive

**Goal:** Implement the stock receiving operation.

**Description:**  
Implement `MovementService.receive` in `MovementService`. The operation must:
1. Validate that product and location are both active.
2. Look up or create the `Inventory` record for the product-location pair.
3. Add the received quantity to `quantityOnHand`.
4. Create an `InventoryMovement` record of type `RECEIVE` with `quantityDelta` equal to the received quantity.
5. Resolve the currently authenticated user and set it as `performedBy`.
6. Execute all of the above within a single transaction.

Implement `POST /api/inventory/movements/receive` in `MovementController`.

**Dependencies:** BE-07, BE-09, BE-12, BE-17, BE-13

**Expected Outcome:**
- Receiving stock increases `quantityOnHand` correctly.
- A `RECEIVE` movement record is created.
- `422` is returned if product or location is inactive.

**Verification:**
- Receive 100 units of a product at a location. Confirm `quantityOnHand` in `inventory` is 100. Confirm a movement record exists.

**Testing:**
- Unit tests for `MovementService.receive`: quantity correctly added, movement record created, inactive product rejected, inactive location rejected.
- Controller integration test: `201` with correct movement response shape.

---

## TASK BE-20: Inventory Movement Service — Transfer

**Goal:** Implement the stock transfer operation.

**Description:**  
Implement `MovementService.transfer`. The operation must:
1. Validate product and both locations are active.
2. Validate source ≠ destination; raise `InvalidOperationException` if equal.
3. Validate available stock at source is ≥ transfer quantity; raise `InsufficientStockException` if not.
4. Decrease source `quantityOnHand` by transfer quantity.
5. Increase or create destination `Inventory` record by transfer quantity.
6. Create a `TRANSFER_OUT` movement at the source.
7. Create a `TRANSFER_IN` movement at the destination.
8. Link the two movement records via `transferCounterpartId`.
9. Execute all of the above within a single transaction.

Implement `POST /api/inventory/movements/transfer` in `MovementController`.

**Dependencies:** BE-19

**Expected Outcome:**
- Transfer reduces source and increases destination correctly.
- Two linked movement records are created.
- Same-location transfer returns `422`.
- Insufficient stock returns `422`.

**Verification:**
- Receive 100 units at location A. Transfer 30 to location B. Confirm A has 70, B has 30. Confirm two linked movements exist.

**Testing:**
- Unit tests for `MovementService.transfer`: successful transfer, insufficient stock, same-location rejection, inactive resource rejection.
- Controller integration test: `201` with linked outbound and inbound movements.

---

## TASK BE-21: Inventory Movement Service — Adjustment

**Goal:** Implement the stock adjustment operation.

**Description:**  
Implement `MovementService.adjust`. The operation must:
1. Validate product and location are active.
2. Validate `quantityDelta` is not zero.
3. Validate that the adjustment does not result in negative stock; raise `InsufficientStockException` if it would.
4. Apply `quantityDelta` to `quantityOnHand`.
5. Create an `ADJUSTMENT` movement record. Reason is always required.
6. Execute all within a single transaction.

Implement `POST /api/inventory/movements/adjust` in `MovementController`.

**Dependencies:** BE-19

**Expected Outcome:**
- Positive adjustment increases stock; negative decreases.
- Adjustment that would cause negative stock returns `422`.
- Zero delta returns `400`.
- Missing reason returns `400`.

**Verification:**
- Adjust a product at a location by -5. Confirm quantity decreases. Attempt to adjust below zero — confirm `422`.

**Testing:**
- Unit tests for `MovementService.adjust`: positive delta, negative delta, zero-to-negative prevention, zero delta rejection, missing reason rejection.
- Controller integration test: `201`, `400` on missing reason, `422` on negative stock.

---

## TASK BE-22: Movement History Query Endpoint

**Goal:** Implement the movement history list and detail endpoints.

**Description:**  
Implement `GET /api/inventory/movements` in `MovementController` with support for all query parameters defined in `docs/06-api-specification.md` (section 6.5): `productId`, `locationId`, `movementType`, `performedBy`, `dateFrom`, `dateTo`, `sortBy`, `sortDir`, `page`, `size`.

Validate that `dateFrom` is not after `dateTo`; return `400` if so.

Implement `GET /api/inventory/movements/{id}`.

**Dependencies:** BE-07, BE-12, BE-19

**Expected Outcome:**
- History is filterable by all supported parameters.
- Results are paginated and sortable.
- Invalid date range returns `400`.

**Verification:**
- Create several movements. Filter by `movementType=RECEIVE`. Confirm only RECEIVE records are returned.

**Testing:**
- Unit tests for the service method: date range validation, filtering correctness.
- Controller integration test: `200` with paginated response, `400` on invalid date range, `404` on unknown ID.

---

## TASK BE-23: Dashboard Service and Controller

**Goal:** Implement the dashboard summary and stock health endpoints.

**Description:**  
Implement `DashboardService`:
- `getSummary`: aggregate total active products, total active locations, count of product-location pairs where `stockStatus = LOW_STOCK`, count where `stockStatus = OUT_OF_STOCK`, and the 10 most recent movements.
- `getStockHealth`: for each active location, compute in-stock, low-stock, and out-of-stock product counts.

Implement `DashboardController` for `GET /api/dashboard/summary` and `GET /api/dashboard/stock-health`.

**Dependencies:** BE-18, BE-22

**Expected Outcome:**
- Dashboard summary returns correct aggregated counts.
- Stock health lists all active locations with their stock distribution.

**Verification:**
- With known seed data, confirm dashboard counts match the actual inventory state.

**Testing:**
- Unit tests for `DashboardService`: correct metric computation, stock health distribution.
- Controller integration test: `200` with expected response shape.

---

## TASK BE-24: User Service and Controller

**Goal:** Implement all user management endpoints.

**Description:**  
Implement `UserService` with: `findAll` (with filtering by role, active status, keyword search), `findById`, `create`, `update`, `deactivate`, `activate`. Password must be hashed using BCrypt before persistence. Enforce `username` and `email` uniqueness. Raise `DuplicateResourceException` on conflict.

Implement `UserController` for all six endpoints defined in `docs/06-api-specification.md` (section 6.7). Secure all endpoints to `ADMIN` role only.

**Dependencies:** BE-13, BE-07, BE-09, BE-12

**Expected Outcome:**
- All user endpoints work as specified.
- Passwords are never stored as plaintext.
- Non-ADMIN access returns `403`.

**Verification:**
- Create a user via API. Inspect the database — confirm `password_hash` is a bcrypt hash. Confirm the plain password is not stored anywhere.

**Testing:**
- Unit tests for `UserService`: create, duplicate username, duplicate email, deactivate, password hashing.
- Controller integration tests: `201`, `409`, `403` for non-admin caller.

---

## TASK BE-25: Logging Configuration

**Goal:** Configure structured logging with correlation ID support.

**Description:**  
Configure Logback via `logback-spring.xml`. Create a request filter or interceptor that generates a correlation ID per request and stores it in the MDC. Include the correlation ID in all log entries. Return the correlation ID in the `X-Correlation-Id` response header. Confirm that sensitive fields (passwords, tokens) are not logged anywhere.

**Dependencies:** BE-14

**Expected Outcome:**
- Every request has a unique correlation ID in logs.
- Correlation ID appears in `X-Correlation-Id` response header.
- No passwords or token values appear in any log output.

**Verification:**
- Make a request and confirm the correlation ID appears consistently across all log lines for that request.

**Testing:**
- Integration test confirming `X-Correlation-Id` header is present on responses.

---

## TASK BE-26: Backend Integration Test Suite Completion

**Goal:** Verify that the full backend test suite meets the 70% coverage requirement.

**Description:**  
Run the full test suite and measure code coverage. Identify any coverage gaps in the service layer, exception handler, and controllers. Write any missing unit or integration tests to reach the 70% minimum defined in NFR-TEST-001. Focus priority coverage on the areas defined in `docs/07-backend-design.md` (section 12.5).

**Dependencies:** All previous backend tasks

**Expected Outcome:**
- Test suite passes.
- Code coverage is at or above 70%.
- All eight priority coverage areas have explicit test cases.

**Verification:**
- Coverage report confirms ≥ 70%.
- All priority scenarios have test coverage.

**Testing:** This task is testing-only.

---

# Phase 3 — Angular Frontend

---

## TASK FE-01: Angular Project Initialization

**Goal:** Initialize the Angular 21.3.11 project with the correct configuration.

**Description:**  
Generate the Angular project in the `frontend/` directory using the Angular CLI. Configure it as a standalone-component application (no NgModule by default). Configure TypeScript strict mode. Create the `environments/` folder with `environment.ts` and `environment.prod.ts`. Set the API base URL in the environment files pointing to the backend.

**Dependencies:** None (can be started in parallel with BE tasks, but integration requires backend running)

**Expected Outcome:**
- Angular project builds and serves with no errors.
- Environment files exist with `apiUrl` configured.

**Verification:**
- `ng serve` starts the development server.
- The default Angular page is visible in the browser.

**Testing:** None at this stage.

---

## TASK FE-02: Core Folder Structure and App Configuration

**Goal:** Create the core folder structure and configure the Angular application root.

**Description:**  
Create the `core/`, `shared/`, `features/`, and `layout/` directories under `src/app/` as defined in `docs/08-frontend-design.md` (section 3). Create `app.config.ts` with `provideRouter`, `provideHttpClient(withInterceptors([]))`, and any other root-level providers. Create `app.routes.ts` with the top-level route stubs. Create the placeholder `app.component.ts` that renders only `<router-outlet>`.

**Dependencies:** FE-01

**Expected Outcome:**
- Folder structure matches the design document.
- Application bootstraps using `app.config.ts` with no module-based setup.
- Routing infrastructure is in place.

**Verification:**
- `ng build` completes without errors.

**Testing:** None at this stage.

---

## TASK FE-03: TypeScript API Models

**Goal:** Create all TypeScript interface models matching the API response contracts.

**Description:**  
Create TypeScript interfaces in each feature's `models/` folder and in `core/models/`, matching every response DTO from `docs/06-api-specification.md`. Create:
- `ApiError`, `FieldError`, `PagedResponse<T>` in `core/models/`
- `CategoryResponse` in `features/categories/models/`
- `ProductResponse`, `ProductDetailResponse` in `features/products/models/`
- `LocationResponse` in `features/locations/models/`
- `InventoryResponse` in `features/inventory/models/`
- `MovementResponse`, `TransferResponse` in `features/inventory/models/`
- `DashboardSummaryResponse`, `StockHealthResponse` in `features/dashboard/models/`
- `UserResponse` in `features/users/models/`
- Enum types: `MovementType`, `StockStatus`, `LocationType`, `UserRole`

No `any` type is permitted.

**Dependencies:** FE-01

**Expected Outcome:**
- All API response shapes are typed.
- TypeScript compiler is satisfied with no implicit `any`.

**Verification:**
- `ng build` completes without type errors.

**Testing:** None for pure interface definitions.

---

## TASK FE-04: Auth Interceptor and Error Interceptor

**Goal:** Implement the two HTTP interceptors.

**Description:**  
Create `AuthInterceptor` in `core/interceptors/`. It reads the JWT token from `AuthService` and attaches `Authorization: Bearer <token>` to every outgoing request.

Create `ErrorInterceptor` in `core/interceptors/`. It handles:
- `401` → clear auth state, redirect to `/login`
- `403` → dispatch notification "You do not have permission to perform this action."
- `500` → dispatch a generic error notification
- Network errors → dispatch connectivity notification
- All other errors → rethrow for service-level handling

Register both interceptors in `app.config.ts`.

**Dependencies:** FE-02

**Expected Outcome:**
- Authenticated requests include the `Authorization` header.
- `401` responses redirect to login.
- `500` responses show a notification.

**Verification:**
- Without a token, inspect outgoing requests — no auth header.
- With a token, confirm auth header is present on all requests.

**Testing:**
- Unit tests for `AuthInterceptor`: confirm header attached when token present, absent when no token.
- Unit tests for `ErrorInterceptor`: confirm redirect on `401`, notification dispatch on `403` and `500`.

---

## TASK FE-05: Auth Service and Login Page

**Goal:** Implement authentication and the login page.

**Description:**  
Create `AuthService` in `core/auth/`. It manages:
- `login(username, password)` → calls `POST /api/auth/login`, stores the JWT token (localStorage or sessionStorage), sets `currentUser` signal.
- `logout()` → clears token and resets `currentUser` signal.
- `isAuthenticated()` → computed signal based on token presence.
- `currentUser` → `Signal<UserResponse | null>`.

Create `AuthGuard` in `core/auth/` that redirects unauthenticated users to `/login`.

Create `LoginComponent` (standalone) at route `/login` with a Reactive Form for username and password. On submit, call `AuthService.login`. On success, navigate to `/dashboard`. On failure, display an error message.

**Dependencies:** FE-03, FE-04

**Expected Outcome:**
- Login form submits credentials and receives a JWT token.
- Authenticated users are redirected to `/dashboard`.
- Unauthenticated users accessing protected routes are redirected to `/login`.

**Verification:**
- Log in with the seeded admin account. Confirm navigation to `/dashboard`.
- Clear the token and navigate to `/products`. Confirm redirect to `/login`.

**Testing:**
- Unit tests for `AuthService`: login success sets `currentUser` signal, logout clears it.
- Unit tests for `AuthGuard`: redirects unauthenticated users.

---

## TASK FE-06: Notification Service and Shell Layout

**Goal:** Implement the application shell and global notification system.

**Description:**  
Create `NotificationService` in `core/notification/`. It manages a signal queue of notifications (each with type: `success`, `error`, `warning`, and a message string). Components enqueue notifications by calling `notify(type, message)`. Notifications auto-dismiss after a timeout.

Create `ShellComponent` (standalone) in `layout/shell/`. It composes `SidebarComponent`, `TopbarComponent`, a `<router-outlet>`, and a notification display area that renders notifications from `NotificationService`.

Create `SidebarComponent` with navigation links to all feature routes. Create `TopbarComponent` displaying the current user's name, role, and a logout button.

Register the shell as the parent layout route in `app.routes.ts`. All authenticated routes render inside the shell.

**Dependencies:** FE-05

**Expected Outcome:**
- After login, the shell (sidebar, topbar, content area) is visible.
- Notifications from `NotificationService` appear and auto-dismiss.
- Logout button clears the session and redirects to `/login`.

**Verification:**
- Log in and navigate between routes — sidebar and topbar remain visible.
- Trigger a notification from `NotificationService` — confirm it appears and disappears.

**Testing:**
- Unit tests for `NotificationService`: enqueue, auto-dismiss after timeout.
- Unit test for `ShellComponent`: topbar shows current user's name; logout calls `AuthService.logout`.

---

## TASK FE-07: Shared Components — Data Table, Pagination, Filter Bar

**Goal:** Implement the foundational shared presentational components.

**Description:**  
Create the following standalone shared components in `shared/components/`:

- `DataTableComponent` — accepts a column configuration and a data array via inputs. Renders a table with sortable column headers. Emits sort change events. Emits row action events (edit, deactivate). Renders `EmptyStateComponent` when data is empty.
- `PaginationComponent` — accepts `currentPage`, `totalPages` as inputs. Emits page change events.
- `FilterBarComponent` — accepts a filter configuration (search input, optional dropdowns) as inputs. Emits filter change events with the current filter state.

**Dependencies:** FE-02

**Expected Outcome:**
- Three shared components exist and render correctly in isolation.
- All interaction is communicated via output events only — no service dependencies.

**Verification:**
- Render each component in a simple test harness and confirm inputs and output events work.

**Testing:**
- Unit tests for `DataTableComponent`: renders rows, emits sort event on header click, emits row action event.
- Unit tests for `PaginationComponent`: emits correct page number on next/previous/page click.
- Unit tests for `FilterBarComponent`: emits filter event on search input change.

---

## TASK FE-08: Shared Components — Status Badge, Confirmation Dialog, Loading, Empty State

**Goal:** Implement the remaining shared presentational components.

**Description:**  
Create the following standalone shared components:

- `StatusBadgeComponent` — accepts a `status` input (`StockStatus` or active/inactive boolean). Renders a colored label.
- `ConfirmationDialogComponent` — accepts `title` and `message` inputs. Renders a modal. Emits `confirmed` and `cancelled` output events.
- `LoadingSpinnerComponent` — accepts a `visible` boolean input.
- `EmptyStateComponent` — accepts a `message` string input and an optional `actionLabel` input.

**Dependencies:** FE-02

**Expected Outcome:**
- All four components render correctly for all input states.

**Verification:**
- Inspect component rendering for each status value.

**Testing:**
- Unit tests for `StatusBadgeComponent`: correct label and style for each status value.
- Unit tests for `ConfirmationDialogComponent`: emits `confirmed` on confirm click, `cancelled` on cancel/close.

---

## TASK FE-09: Shared Pipes and Directives

**Goal:** Implement shared pipes and the role visibility directive.

**Description:**  
Create `StockStatusPipe` in `shared/pipes/` — transforms `StockStatus` enum values to human-readable labels (`IN_STOCK` → `"In Stock"`, etc.).

Create `MovementTypePipe` — transforms `MovementType` values to labels (`TRANSFER_OUT` → `"Transfer Out"`, etc.).

Create `RoleVisibilityDirective` in `shared/directives/` — reads the current user's role from `AuthService` and shows or hides the host element based on a `roles` input array.

**Dependencies:** FE-05

**Expected Outcome:**
- Pipes transform all enum values correctly.
- `RoleVisibilityDirective` shows elements for matching roles and hides them for others.

**Verification:**
- Confirm pipe transformations for all valid input values.

**Testing:**
- Unit tests for `StockStatusPipe` and `MovementTypePipe`: all enum values produce correct labels.
- Unit tests for `RoleVisibilityDirective`: element visible when user role matches, hidden when not.

---

## TASK FE-10: Category Feature — List and Form

**Goal:** Implement the categories feature pages and service.

**Description:**  
Create `CategoryService` in `features/categories/services/`. Implement:
- `loadAll(filters, pagination)` — calls `GET /api/categories`, stores result in `categories` signal.
- `create(request)` — calls `POST /api/categories`.
- `update(id, request)` — calls `PUT /api/categories/{id}`.
- `deactivate(id)` / `activate(id)` — calls respective PATCH endpoints.
- Server error field mapping for `409` on create/update.

Create `CategoryListComponent` (page) — displays category list using `DataTableComponent` and `FilterBarComponent`. Handles deactivate action via `ConfirmationDialogComponent`. Dispatches success/error notifications.

Create `CategoryFormComponent` (page) — Reactive Form with `name` and `description` fields. Create/edit mode determined by route param. Validates required fields. Maps server `fieldErrors` to form controls.

Register routes `/categories`, `/categories/new`, `/categories/:id/edit`.

**Dependencies:** FE-07, FE-08, FE-09, FE-05

**Expected Outcome:**
- Categories can be listed, created, edited, and deactivated.
- Form shows validation errors. Server errors appear at the correct field.

**Verification:**
- Create a category through the UI. Attempt to create a duplicate name — confirm `409` error appears on the name field.

**Testing:**
- Unit tests for `CategoryService`: `loadAll` stores results in signal, `create` with server `409` error maps to form.
- Unit tests for `CategoryFormComponent`: required field validation, edit mode disables nothing.

---

## TASK FE-11: Location Feature — List and Form

**Goal:** Implement the locations feature pages and service.

**Description:**  
Create `LocationService` and the `LocationListComponent` and `LocationFormComponent` following the same pattern as `FE-10`. The location form includes a `type` dropdown (`WAREHOUSE`, `STORE`) and an optional address field. Filter bar supports filtering by `type`.

Register routes `/locations`, `/locations/new`, `/locations/:id/edit`.

**Dependencies:** FE-07, FE-08, FE-09, FE-05

**Expected Outcome:**
- Locations can be listed (filterable by type), created, edited, and deactivated.

**Verification:**
- Create a WAREHOUSE and a STORE location. Filter by type — confirm correct results.

**Testing:**
- Unit tests for `LocationService`: signal updates, type filter.
- Unit tests for `LocationFormComponent`: type field is required, address is optional.

---

## TASK FE-12: Product Feature — List and Detail

**Goal:** Implement the product list and detail pages.

**Description:**  
Create `ProductService` in `features/products/services/`. Implement `loadAll` (with category, active, and keyword filters), `loadById`.

Create `ProductListComponent` — displays product list using shared components. Includes category and status filter dropdowns populated from `CategoryService`. Handles deactivate/activate via confirmation dialog.

Create `ProductDetailComponent` — displays product metadata and a `ProductInventoryTableComponent` showing current on-hand quantities by location with `StockStatus` badges.

Register routes `/products`, `/products/:id`.

**Dependencies:** FE-07, FE-08, FE-09, FE-10

**Expected Outcome:**
- Products list with category/status filter.
- Product detail shows metadata and per-location inventory.

**Verification:**
- Create a product in the backend and verify it appears in the list. Click to view detail — confirm inventory table is present (empty at first).

**Testing:**
- Unit tests for `ProductService`: load list, load detail, deactivate.
- Unit tests for `ProductDetailComponent`: renders inventory table with `StockStatus` badges.

---

## TASK FE-13: Product Feature — Form

**Goal:** Implement the product create and edit form.

**Description:**  
Create `ProductFormComponent` — Reactive Form with SKU (disabled in edit mode), name, description, category (dropdown from `CategoryService`), unit of measure, and reorder threshold. Validate SKU not blank (create), name not blank, category required, reorder threshold ≥ 0. Map server `409` SKU conflict to the SKU field.

Register routes `/products/new`, `/products/:id/edit`.

**Dependencies:** FE-12

**Expected Outcome:**
- Products can be created and edited through the form.
- SKU is disabled in edit mode.
- Duplicate SKU error appears on the SKU field.

**Verification:**
- Create a product. Edit it — confirm SKU field is disabled. Attempt duplicate SKU — confirm field error.

**Testing:**
- Unit tests for `ProductFormComponent`: SKU disabled in edit mode, duplicate SKU server error mapped to SKU control, reorder threshold min validation.

---

## TASK FE-14: Inventory Overview Page

**Goal:** Implement the inventory overview page.

**Description:**  
Create `InventoryService` in `features/inventory/services/`. Implement `loadAll` with filters for `locationId`, `categoryId`, `stockStatus`, and keyword search, plus pagination and sorting.

Create `InventoryOverviewComponent` — displays inventory list using `DataTableComponent`. Filter bar includes location, category, and stock status dropdowns. Each row displays the product name, SKU, location, quantity, unit of measure, and a `StatusBadgeComponent`. Rows link to the product detail page.

Register route `/inventory`.

**Dependencies:** FE-12, FE-11, FE-08

**Expected Outcome:**
- Inventory list is filterable and sortable.
- Stock status badges are rendered correctly.

**Verification:**
- With data from the backend, confirm filtering by `stockStatus=LOW_STOCK` returns only low-stock items.

**Testing:**
- Unit tests for `InventoryService`: signal state after load, filter parameters.
- Unit tests for `InventoryOverviewComponent`: renders stock status badge for each row.

---

## TASK FE-15: Inventory Movement Forms — Receive, Transfer, Adjust

**Goal:** Implement the three inventory movement forms.

**Description:**  
Create `MovementService` in `features/inventory/services/`. Implement `receive`, `transfer`, and `adjust` methods that call the corresponding POST endpoints.

Create `ReceiveFormComponent` — form with product (searchable), location (dropdown), quantity, reference ID, and optional reason. On success, navigate to `/inventory` and show a success notification.

Create `TransferFormComponent` — form with product, source location, destination location, quantity, reference ID, reason. Cross-field validator ensures source ≠ destination. On `422` for insufficient stock, display error above the form.

Create `AdjustmentFormComponent` — form with product, location, quantity delta (can be negative), reason (required), reference ID. On `422` for negative stock, display error above the form.

Register routes `/inventory/receive`, `/inventory/transfer`, `/inventory/adjust`.

**Dependencies:** FE-14

**Expected Outcome:**
- All three movement forms submit correctly and update inventory.
- Business rule errors (insufficient stock, inactive resource) are displayed to the user.

**Verification:**
- Receive 50 units. Navigate to inventory — confirm quantity is 50. Transfer 20. Adjust -5. Verify all movements appear in history.

**Testing:**
- Unit tests for `MovementService`: receive, transfer, adjust signal state updates.
- Unit tests for `TransferFormComponent`: cross-field validator rejects same-location, server `422` error displayed.
- Unit tests for `AdjustmentFormComponent`: reason required validation, `422` server error displayed.

---

## TASK FE-16: Inventory History Page

**Goal:** Implement the inventory movement history list page.

**Description:**  
Create `HistoryService` in `features/history/services/`. Implement `loadAll` with filters for `productId`, `locationId`, `movementType`, `dateFrom`, `dateTo`, and sorting/pagination.

Create `HistoryListComponent` — displays movement history in a data table. Filter bar includes movement type, product, location, and date range pickers. Each row shows: movement type badge (via `MovementTypePipe`), product name, location, quantity delta (signed, colored positive/negative), actor, timestamp. Pagination is handled via `PaginationComponent`.

Register route `/history`.

**Dependencies:** FE-09, FE-07, FE-15

**Expected Outcome:**
- Movement history is listed and filterable.
- Date range filter validates that start ≤ end before sending to the API.

**Verification:**
- Perform several movements, then filter history by `movementType`. Confirm only matching records appear.

**Testing:**
- Unit tests for `HistoryService`: filter signal, date range validation.
- Unit tests for `HistoryListComponent`: renders signed quantity delta with correct sign indicator.

---

## TASK FE-17: Dashboard Page

**Goal:** Implement the dashboard page.

**Description:**  
Create `DashboardService` in `features/dashboard/`. Implement `loadSummary` and `loadStockHealth` that call the respective dashboard endpoints and store results in signals.

Create `DashboardComponent` — displays:
- Four `MetricCardComponent` instances showing total products, total locations, low-stock count, and out-of-stock count.
- Low-stock and out-of-stock metric cards navigate to `/inventory?stockStatus=LOW_STOCK` and `/inventory?stockStatus=OUT_OF_STOCK` when clicked (FR-DSH-004).
- `StockHealthTableComponent` displaying per-location stock distribution.
- Recent movements list (last 10 movements).

Register route `/dashboard`.

**Dependencies:** FE-14, FE-16, FE-08

**Expected Outcome:**
- Dashboard loads and displays correct aggregated metrics.
- Clicking metric cards navigates to pre-filtered inventory views.

**Verification:**
- Confirm dashboard counts match the actual inventory state visible in the inventory overview.

**Testing:**
- Unit tests for `DashboardService`: signal state after load.
- Unit tests for `DashboardComponent`: metric card click navigates with correct query params.

---

## TASK FE-18: User Management Feature

**Goal:** Implement the user management pages (ADMIN only).

**Description:**  
Create `UserService` in `features/users/services/`. Implement CRUD and deactivation operations.

Create `UserListComponent` — displays user list with role and status filter. Deactivate/activate via confirmation dialog.

Create `UserFormComponent` — Reactive Form with username (disabled in edit), password (create only), full name, email, role dropdown. Map server `409` errors (username/email) to the respective fields.

Create `RoleGuard` that allows only `ADMIN` users. Apply it to all `/users` routes.

Register routes `/users`, `/users/new`, `/users/:id/edit`.

**Dependencies:** FE-07, FE-08, FE-09, FE-05

**Expected Outcome:**
- ADMIN users can manage all user accounts.
- Non-ADMIN users attempting to access `/users` are redirected to `/dashboard`.
- Username field is disabled in edit mode.

**Verification:**
- Log in as ADMIN. Create a user. Log in as a non-ADMIN user and attempt to navigate to `/users` — confirm redirect.

**Testing:**
- Unit tests for `UserService`: create, duplicate username maps to field error.
- Unit tests for `RoleGuard`: non-ADMIN redirected, ADMIN allowed.
- Unit tests for `UserFormComponent`: username disabled in edit mode, password field absent in edit mode.

---

## TASK FE-19: Frontend Test Suite Completion

**Goal:** Verify that the full frontend test suite meets the 70% coverage requirement.

**Description:**  
Run the full frontend test suite and measure coverage. Identify gaps. Write missing tests to reach the 70% minimum defined in NFR-TEST-001. Ensure all ten priority coverage areas from `docs/08-frontend-design.md` (section 16.5) are explicitly covered.

**Dependencies:** All previous frontend tasks

**Expected Outcome:**
- All tests pass.
- Coverage is at or above 70%.
- All ten priority areas have explicit test cases.

**Verification:**
- Coverage report confirms ≥ 70%.

**Testing:** This task is testing-only.

**Status:** Completed in implementation session.

---

## TASK FE-20: End-to-End Verification

**Goal:** Verify the complete application works correctly with the backend running.

**Description:**  
With both the Spring Boot backend and Angular frontend running together, verify the following end-to-end scenarios against the acceptance criteria in `docs/02-functional-requirements.md`:

1. Log in with admin credentials.
2. Create a category, a location, and a product.
3. Receive stock at the location.
4. Transfer stock to a second location.
5. Perform a positive and negative stock adjustment.
6. View the inventory overview — confirm stock status badges are correct.
7. View the dashboard — confirm metrics match inventory state.
8. Filter history by movement type — confirm only matching records appear.
9. Deactivate a product — confirm it cannot be selected in movement forms.
10. Log in as a non-ADMIN user — confirm `/users` is inaccessible.

**Dependencies:** FE-19, BE-26

**Expected Outcome:**
- All ten scenarios complete without errors.
- All functional requirements from Phase 1 and 2 are satisfied.

**Verification:**
- Each scenario above completes successfully in the browser.

**Testing:** Manual end-to-end verification against the acceptance criteria in `docs/02-functional-requirements.md` (section 7).

---

## 3. Implementation Order Summary

```
Phase 1 — Database
  DB-01 → DB-02 → DB-03 → DB-04
                        ├── DB-05
                        ├── DB-06
                        └── DB-07 (needs DB-04)
                              └── DB-08 (needs DB-07, DB-05)
                                    └── DB-09 (needs DB-07, DB-05, DB-06)
                        └── DB-10 (needs DB-04, DB-05, DB-06)

Phase 2 — Backend
  BE-01 → BE-02 → BE-03 → BE-04 → BE-05 → BE-06
                ↓
  BE-07 (needs BE-02–06) → BE-08 → BE-09 → BE-10 → BE-11 → BE-12
                                                              ↓
  BE-13 → BE-14 → BE-15 → BE-16 → BE-17 → BE-18
                                            ↓
  BE-19 → BE-20 → BE-21 → BE-22 → BE-23 → BE-24 → BE-25 → BE-26

Phase 3 — Frontend
  FE-01 → FE-02 → FE-03
                  ↓
  FE-04 → FE-05 → FE-06 → FE-07 → FE-08 → FE-09
                                              ↓
  FE-10 → FE-11 → FE-12 → FE-13
                    ↓
  FE-14 → FE-15 → FE-16 → FE-17 → FE-18 → FE-19 → FE-20
```

---

## 4. Task Count Summary

| Phase | Tasks | Focus |
|---|---|---|
| Phase 1 — Database | 10 | Schema, migrations, seed data |
| Phase 2 — Backend | 26 | API, services, security, testing |
| Phase 3 — Frontend | 20 | Components, services, routing, testing |
| **Total** | **56** | |
