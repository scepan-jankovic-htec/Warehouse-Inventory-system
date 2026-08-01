# Warehouse Inventory System — Frontend Design

## 1. Document Purpose

This document describes the complete design of the Angular 21.3.11 frontend for the Warehouse Inventory System. It defines folder structure, component architecture, services, routing, state management, forms, HTTP communication, error handling, and testing strategy.

This document does not contain Angular code. It is the implementation reference for all frontend work.

---

## 2. Technology Overview

| Concern | Technology |
|---|---|
| Framework | Angular 21.3.11 |
| Language | TypeScript |
| Component model | Standalone components |
| Reactivity | Angular Signals |
| HTTP client | Angular `HttpClient` |
| Routing | Angular Router |
| Forms | Angular Reactive Forms |
| UI component library | Angular Material |
| Styling | Component-scoped CSS |
| Testing | Jest or Jasmine + Karma, Angular Testing Library |
| Build | Angular CLI |

### 2.1 Key Angular 21 Conventions

Angular 21 is fully standalone-first. This project does **not** use `NgModule`-based feature modules. Every component, directive, and pipe is declared as a standalone artifact and imports its own dependencies directly.

The project uses **Angular Signals** as the primary reactivity primitive. `RxJS` observables are used only where Angular APIs require them (for example, `HttpClient`) and are converted to signals at the service boundary wherever possible.

The application uses **Angular Material** as the approved UI component library and design system foundation. Material components are used for consistent controls, forms, dialogs, tables, navigation, and accessibility defaults, with project-specific styling layered on top where needed.

---

## 3. Folder Structure

```
src/
├── app/
│   │
│   ├── core/                              # Application-wide singletons, provided at root
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── auth.model.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   ├── models/
│   │   │   └── api-error.model.ts
│   │   └── notification/
│   │       └── notification.service.ts
│   │
│   ├── shared/                            # Reusable standalone components, pipes, directives
│   │   ├── components/
│   │   │   ├── confirmation-dialog/
│   │   │   │   └── confirmation-dialog.component.ts
│   │   │   ├── data-table/
│   │   │   │   └── data-table.component.ts
│   │   │   ├── filter-bar/
│   │   │   │   └── filter-bar.component.ts
│   │   │   ├── pagination/
│   │   │   │   └── pagination.component.ts
│   │   │   ├── status-badge/
│   │   │   │   └── status-badge.component.ts
│   │   │   ├── empty-state/
│   │   │   │   └── empty-state.component.ts
│   │   │   └── loading-spinner/
│   │   │       └── loading-spinner.component.ts
│   │   ├── pipes/
│   │   │   ├── stock-status.pipe.ts
│   │   │   └── movement-type.pipe.ts
│   │   └── directives/
│   │       └── role-visibility.directive.ts
│   │
│   ├── features/                          # One folder per business domain
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── models/
│   │   │   │   └── dashboard.model.ts
│   │   │   └── components/
│   │   │       ├── metric-card/
│   │   │       │   └── metric-card.component.ts
│   │   │       └── stock-health-table/
│   │   │           └── stock-health-table.component.ts
│   │   │
│   │   ├── products/
│   │   │   ├── pages/
│   │   │   │   ├── product-list/
│   │   │   │   │   └── product-list.component.ts
│   │   │   │   ├── product-detail/
│   │   │   │   │   └── product-detail.component.ts
│   │   │   │   └── product-form/
│   │   │   │       └── product-form.component.ts
│   │   │   ├── components/
│   │   │   │   └── product-inventory-table/
│   │   │   │       └── product-inventory-table.component.ts
│   │   │   ├── services/
│   │   │   │   └── product.service.ts
│   │   │   └── models/
│   │   │       └── product.model.ts
│   │   │
│   │   ├── categories/
│   │   │   ├── pages/
│   │   │   │   ├── category-list/
│   │   │   │   │   └── category-list.component.ts
│   │   │   │   └── category-form/
│   │   │   │       └── category-form.component.ts
│   │   │   ├── services/
│   │   │   │   └── category.service.ts
│   │   │   └── models/
│   │   │       └── category.model.ts
│   │   │
│   │   ├── locations/
│   │   │   ├── pages/
│   │   │   │   ├── location-list/
│   │   │   │   │   └── location-list.component.ts
│   │   │   │   └── location-form/
│   │   │   │       └── location-form.component.ts
│   │   │   ├── services/
│   │   │   │   └── location.service.ts
│   │   │   └── models/
│   │   │       └── location.model.ts
│   │   │
│   │   ├── inventory/
│   │   │   ├── pages/
│   │   │   │   ├── inventory-overview/
│   │   │   │   │   └── inventory-overview.component.ts
│   │   │   │   ├── receive-form/
│   │   │   │   │   └── receive-form.component.ts
│   │   │   │   ├── transfer-form/
│   │   │   │   │   └── transfer-form.component.ts
│   │   │   │   └── adjustment-form/
│   │   │   │       └── adjustment-form.component.ts
│   │   │   ├── services/
│   │   │   │   └── inventory.service.ts
│   │   │   └── models/
│   │   │       ├── inventory.model.ts
│   │   │       └── movement.model.ts
│   │   │
│   │   ├── history/
│   │   │   ├── pages/
│   │   │   │   └── history-list/
│   │   │   │       └── history-list.component.ts
│   │   │   ├── services/
│   │   │   │   └── history.service.ts
│   │   │   └── models/
│   │   │       └── history-entry.model.ts
│   │   │
│   │   └── users/
│   │       ├── pages/
│   │       │   ├── user-list/
│   │       │   │   └── user-list.component.ts
│   │       │   └── user-form/
│   │       │       └── user-form.component.ts
│   │       ├── services/
│   │       │   └── user.service.ts
│   │       └── models/
│   │           └── user.model.ts
│   │
│   ├── layout/                            # Shell components: nav, sidebar, shell
│   │   ├── shell/
│   │   │   └── shell.component.ts
│   │   ├── sidebar/
│   │   │   └── sidebar.component.ts
│   │   └── topbar/
│   │       └── topbar.component.ts
│   │
│   ├── app.component.ts
│   ├── app.config.ts                      # provideRouter, provideHttpClient, etc.
│   └── app.routes.ts                      # Top-level route definitions
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
└── assets/
```

---

## 4. Standalone Components

All components in this project are standalone. There are no `NgModule` declarations. Each component:

- Is decorated with `standalone: true` (implied in Angular 21 as the default)
- Imports only the dependencies it needs directly in its `imports` array
- Is self-contained and independently testable

**Why standalone:**  
Standalone components eliminate the overhead of module boilerplate, make dependencies explicit at the component level, and are required for optimal tree-shaking and lazy loading in Angular 21.

**Component categories:**

| Category | Location | Characteristic |
|---|---|---|
| Page component | `features/<domain>/pages/` | Route entry point; owns data loading and top-level state |
| Feature component | `features/<domain>/components/` | Domain-specific presentational component; receives data via inputs |
| Shared component | `shared/components/` | Domain-agnostic; used across multiple features |
| Layout component | `layout/` | Application shell, sidebar, topbar; always visible after login |

---

## 5. Signals

Angular Signals are the primary reactivity mechanism throughout the application. Observables from `HttpClient` are used for API calls and are converted to signals immediately in the service layer using `toSignal()` or by storing responses into writable signals.

### 5.1 Usage Patterns

| Pattern | Where Used | Description |
|---|---|---|
| `signal<T>()` | Services | Writable state — holds lists, selected items, loading flags |
| `computed()` | Services and components | Derived state — filtered lists, stock status, form validity |
| `effect()` | Components | Side effects triggered by signal changes — scroll reset, focus |
| `toSignal()` | Services | Converts an Observable (for example, HTTP response) to a read-only signal |
| Input signals (`input()`) | Shared components | Declare `@Input` as a signal for reactive input binding |

### 5.2 State Held as Signals

| Signal | Type | Owned by | Description |
|---|---|---|---|
| `products` | `Signal<ProductResponse[]>` | `ProductService` | Current loaded product list |
| `selectedProduct` | `Signal<ProductDetailResponse \| null>` | `ProductService` | Detail view target |
| `inventoryList` | `Signal<InventoryResponse[]>` | `InventoryService` | Current inventory view |
| `movements` | `Signal<MovementResponse[]>` | `HistoryService` | Current movement history list |
| `dashboardSummary` | `Signal<DashboardSummaryResponse \| null>` | `DashboardService` | Dashboard metrics |
| `isLoading` | `Signal<boolean>` | Per service | Loading indicator for async operations |
| `currentUser` | `Signal<UserResponse \| null>` | `AuthService` | Currently authenticated user |

---

## 6. Services

Services encapsulate all HTTP communication and own feature-level state. They are provided at the root level (`providedIn: 'root'`) unless a feature requires isolated state, in which case they are provided at the route level.

### 6.1 Core Services (`core/`)

| Service | Responsibility |
|---|---|
| `AuthService` | Login, logout, JWT token storage and refresh, current user signal |
| `NotificationService` | Global application toast/notification queue signal, consumed by the shell |

### 6.2 Feature Services (`features/<domain>/services/`)

Each feature has one service responsible for all API calls and state management for that domain.

| Service | API Resources | State Managed |
|---|---|---|
| `CategoryService` | `/api/categories` | Category list, selected category, loading state |
| `ProductService` | `/api/products` | Product list, product detail, loading state |
| `LocationService` | `/api/locations` | Location list, selected location, loading state |
| `InventoryService` | `/api/inventory` | Inventory list, current filters, loading state |
| `HistoryService` | `/api/inventory/movements` (GET) | Movement history, active filters, loading state |
| `MovementService` | `/api/inventory/movements` (POST) | Submission state, last operation result |
| `DashboardService` | `/api/dashboard` | Summary metrics, stock-health data |
| `UserService` | `/api/users` | User list, selected user, loading state |

### 6.3 Service Design Rules

- Services do not contain template logic or DOM manipulation.
- Services hold only the state required for the features that consume them.
- Services do not directly depend on each other unless the dependency is justified and explicitly documented.
- Services expose signals or computed values — not raw Observables — to components.
- Pagination, sort, and filter parameters are held as signals within the relevant service, not scattered across components.

---

## 7. Routing

### 7.1 Route Configuration

All routes are defined in `app.routes.ts` at the top level. Feature routes are defined in separate route arrays co-located with each feature and imported lazily.

```
/                          → redirect to /dashboard
/login                     → LoginComponent (unauthenticated)
/dashboard                 → DashboardComponent
/products                  → ProductListComponent
/products/new              → ProductFormComponent (create mode)
/products/:id              → ProductDetailComponent
/products/:id/edit         → ProductFormComponent (edit mode)
/categories                → CategoryListComponent
/categories/new            → CategoryFormComponent
/categories/:id/edit       → CategoryFormComponent
/locations                 → LocationListComponent
/locations/new             → LocationFormComponent
/locations/:id/edit        → LocationFormComponent
/inventory                 → InventoryOverviewComponent
/inventory/receive         → ReceiveFormComponent
/inventory/transfer        → TransferFormComponent
/inventory/adjust          → AdjustmentFormComponent
/history                   → HistoryListComponent
/users                     → UserListComponent (ADMIN only)
/users/new                 → UserFormComponent
/users/:id/edit            → UserFormComponent
```

### 7.2 Lazy Loading

All feature route groups are lazy-loaded. Each feature's route array is referenced using `loadChildren` with a dynamic import. The login page and authentication flow are loaded eagerly.

### 7.3 Route Guards

| Guard | Applied to | Behavior |
|---|---|---|
| `AuthGuard` | All routes except `/login` | Redirects unauthenticated users to `/login` |
| `RoleGuard` | `/users` and sub-routes | Redirects non-ADMIN users to `/dashboard` |

Guards read from the `AuthService` signals to make their decisions synchronously where possible.

---

## 8. State Management

The application uses **service-with-signals** as its state management pattern. There is no external state management library (for example, NgRx, Akita).

### 8.1 Pattern

```
HTTP Response
      │
      ▼
Feature Service (writes to signal)
      │
      ▼
Signal (read by component via computed or direct binding)
      │
      ▼
Component Template (renders current signal value)
```

- Page components read signals from their feature service.
- Presentational components receive data as signal inputs or plain inputs.
- User actions in components call service methods.
- Service methods perform HTTP calls, update signals on success, and trigger notifications on error.

### 8.2 Filter and Pagination State

Filter and pagination parameters for list views are held as signals inside the relevant service. When a user changes a filter, the service updates the filter signal and re-fetches from the API. The component reads the result signal and re-renders reactively.

This approach keeps the URL clean and the state source-of-truth centralized in the service rather than split between the URL and component state.

### 8.3 What Is Not Stored in Global State

- Form input values (owned by Reactive Form instances in page components)
- Confirmation dialog open/close state (owned by the dialog component itself)
- Transient UI state (hover, focus) — owned by individual components

---

## 9. Forms

All forms use **Angular Reactive Forms**. Template-driven forms are not used in this project.

### 9.1 Why Reactive Forms

Reactive Forms provide programmatic access to form state, making validation logic testable and the form structure explicit in TypeScript rather than hidden in the template.

### 9.2 Form Pages and Their Forms

| Page | Form Purpose |
|---|---|
| `ProductFormComponent` | Create and edit product — SKU (create only), name, description, category, unit of measure, reorder threshold |
| `CategoryFormComponent` | Create and edit category — name, description |
| `LocationFormComponent` | Create and edit location — name, type, address |
| `ReceiveFormComponent` | Receive stock — product, location, quantity, reference ID, reason |
| `TransferFormComponent` | Transfer stock — product, source location, destination location, quantity, reference ID, reason |
| `AdjustmentFormComponent` | Adjust stock — product, location, quantity delta, reason (required), reference ID |
| `UserFormComponent` | Create and edit user — username (create only), password (create only), full name, email, role |

### 9.3 Validation Strategy

Client-side validation on forms provides immediate user feedback. It mirrors the server-side validation rules defined in the API specification. The following validation rules are applied in forms:

| Rule | Form Field | Behavior |
|---|---|---|
| Required | All mandatory fields | Field marked invalid; error message shown on blur or submit |
| Max length | Name, description, reason, reference | Character limit enforced with inline message |
| Minimum value | Quantity fields (≥ 1), reorder threshold (≥ 0) | Numeric field invalid below minimum |
| Non-zero | `quantityDelta` in adjustment | Zero value shows specific error message |
| Email format | Email in user form | Standard email pattern validation |
| Different source/destination | Transfer form | Cross-field validator on the form group |

### 9.4 Server Validation Error Display

When the API returns `400 Bad Request` with `fieldErrors`, the frontend maps each field error to the corresponding form control and marks it invalid with the server-provided message. This ensures server-enforced constraints (for example, duplicate SKU) are surfaced exactly at the relevant form field.

### 9.5 Form Mode (Create vs Edit)

`ProductFormComponent`, `CategoryFormComponent`, `LocationFormComponent`, and `UserFormComponent` each operate in create or edit mode, determined by the presence of a route `:id` parameter. Fields that are immutable after creation (for example: SKU, username) are disabled in edit mode.

---

## 10. HTTP Communication

### 10.1 HttpClient

All HTTP calls use Angular's `HttpClient`, configured in `app.config.ts` with `provideHttpClient(withInterceptors([...]))`.

### 10.2 Auth Interceptor (`core/interceptors/auth.interceptor.ts`)

The auth interceptor automatically attaches the `Authorization: Bearer <token>` header to every outgoing request. It reads the token from `AuthService`. If no token is present, the request proceeds without the header (the server will return `401`).

### 10.3 Error Interceptor (`core/interceptors/error.interceptor.ts`)

The error interceptor processes every HTTP error response before it reaches the service layer. Its responsibilities:

| HTTP Status | Action |
|---|---|
| `401 Unauthorized` | Clear authentication state and redirect to `/login` |
| `403 Forbidden` | Dispatch a notification: "You do not have permission to perform this action." |
| `404 Not Found` | Pass error through to the service for local handling |
| `409 Conflict` | Pass error through to the service for local handling (form field error display) |
| `422 Unprocessable Entity` | Pass error through to the service for local handling |
| `500 Internal Server Error` | Dispatch a generic error notification; log to console |
| Network error / timeout | Dispatch a connectivity notification |

### 10.4 API Base URL

The API base URL is defined in `environment.ts` and `environment.prod.ts`. Services construct endpoint URLs by concatenating the base URL with the resource path. The base URL is never hardcoded inside service files.

### 10.5 Typed API Models

Every API response is typed against a TypeScript interface defined in the feature's `models/` folder. Models mirror the response DTOs documented in the API specification. No `any` type is used for API responses.

---

## 11. Error Handling

### 11.1 Error Handling Layers

```
HTTP Error
      │
      ▼
Error Interceptor
  ├── 401 → redirect to login
  ├── 403 → global notification
  ├── 500 → global notification
  └── others → rethrow to service
      │
      ▼
Feature Service
  ├── 404 / 409 / 422 → set error signal, surface to component
  └── pass structured fieldErrors to form if applicable
      │
      ▼
Component
  ├── reads error signal
  ├── applies fieldErrors to form controls
  └── displays inline form errors or alert messages
```

### 11.2 Notification Service

`NotificationService` holds a queue of notification messages as a signal. The `ShellComponent` reads this signal and renders toast-style notifications for global events. Notifications include:

- Success confirmations after create, update, deactivate, and movement operations
- Forbidden and server error messages
- Connectivity failure messages

### 11.3 Error Display Rules

- Field validation errors appear inline below the relevant form control.
- Business rule errors from the API (for example, insufficient stock) appear as a form-level alert above the submit button.
- Global errors (403, 500, connectivity) appear as notifications managed by `NotificationService`.
- Error messages shown to users are human-readable and non-technical, consistent with NFR-ERR-001.

---

## 12. Shared Components

All shared components are standalone, generic, and domain-agnostic. They receive all data through inputs and emit user interactions through outputs.

| Component | Purpose |
|---|---|
| `DataTableComponent` | Renders tabular data with configurable columns, sort headers, and row actions. Used by all list views. |
| `FilterBarComponent` | Renders a filter row with search input, dropdown filters, and clear-all action. Emits filter change events. |
| `PaginationComponent` | Renders page navigation controls. Receives total pages and current page; emits page change events. |
| `StatusBadgeComponent` | Renders a colored badge for `StockStatus`, `MovementType`, `LocationType`, and active/inactive state. |
| `ConfirmationDialogComponent` | Reusable modal dialog for destructive actions (deactivate, delete). Accepts title and message inputs; emits confirm/cancel output. |
| `EmptyStateComponent` | Displays an informative placeholder when a list has no results. Accepts message and optional action label as inputs. |
| `LoadingSpinnerComponent` | Displays a loading indicator. Visibility is controlled by an input signal. |

---

## 13. Shared Pipes

| Pipe | Input | Output | Example |
|---|---|---|---|
| `StockStatusPipe` | `'IN_STOCK'` / `'LOW_STOCK'` / `'OUT_OF_STOCK'` | Human-readable label | `'Low Stock'` |
| `MovementTypePipe` | `'RECEIVE'` / `'TRANSFER_OUT'` / `'TRANSFER_IN'` / `'ADJUSTMENT'` | Human-readable label | `'Transfer Out'` |

---

## 14. Shared Directives

| Directive | Purpose |
|---|---|
| `RoleVisibilityDirective` | Shows or hides a host element based on the current user's role, read from `AuthService`. Used to conditionally display admin actions without affecting routing security. |

---

## 15. Layout

The application shell is rendered by `ShellComponent`, which is the top-level component loaded after authentication. It composes:

- `SidebarComponent` — primary navigation links to all features
- `TopbarComponent` — displays the current user's name, role badge, and logout action
- `<router-outlet>` — renders the active feature page
- Notification container — reads `NotificationService` signal and renders toasts

The login page (`/login`) renders outside the shell with its own minimal layout.

---

## 16. Testing Strategy

### 16.1 Coverage Target

Consistent with NFR-TEST-001, the frontend shall maintain at least **70% unit test coverage** across components, services, pipes, directives, and guards.

### 16.2 Unit Tests

Unit tests cover individual classes in isolation. Dependencies (services, `HttpClient`) are replaced with mocks or testing utilities.

**Test focus by artifact type:**

| Type | Test Focus |
|---|---|
| Services | Signal state changes after API calls, correct HTTP method/URL/body, error handling |
| Page components | Correct service method calls on load and on user actions; conditional rendering based on signals |
| Shared components | Input/output behavior; correct rendering for different input values |
| Pipes | Correct transformation for all valid inputs and edge cases |
| Guards | Redirect behavior when unauthenticated or unauthorized |
| Interceptors | Correct header attachment (auth interceptor); correct redirect and notification dispatch (error interceptor) |
| Forms | Validation state for each rule (required, min, cross-field), disabled fields in edit mode |

### 16.3 Test Framework

- **Jest** is the preferred test runner for speed and snapshot support.
- **Angular Testing Utilities** (`TestBed`, `ComponentFixture`) are used for component integration tests.
- `HttpClientTestingModule` / `HttpTestingController` is used for testing service HTTP calls.

### 16.4 Test Design Rules

- Tests are independent and do not share mutable state.
- No real HTTP calls are made in any unit or component test.
- Signal-based state is tested by calling service methods and asserting the resulting signal values directly.
- Each test file is co-located with the file it tests (for example, `product.service.spec.ts` lives alongside `product.service.ts`).
- Mock data is defined in dedicated test fixture files, not inline per test.

### 16.5 Priority Coverage Areas

The following areas must have explicit tests regardless of overall coverage metrics:

1. `AuthService` — login, logout, token persistence, current user signal
2. `AuthGuard` and `RoleGuard` — redirect behavior
3. `AuthInterceptor` — header attachment
4. `ErrorInterceptor` — 401 redirect, 403/500 notification dispatch
5. `MovementService` — form submission for receive, transfer, and adjustment
6. Form validation — all validation rules per form (required, min value, cross-field)
7. Server error mapping — `fieldErrors` from `400` response applied to correct form controls
8. `ConfirmationDialogComponent` — confirm and cancel output events
9. `DataTableComponent` — sort header emit and row action emit
10. `StockStatusPipe` and `MovementTypePipe` — all input values

---

## 17. Summary of Design Decisions

| Decision | Rationale |
|---|---|
| Standalone components only | Removes NgModule overhead; aligns with Angular 21 defaults |
| Signals as primary reactivity | More ergonomic than pure RxJS for component state; simpler mental model |
| Service-with-signals state pattern | No external library dependency; sufficient for this application's complexity |
| Reactive Forms only | Testable, explicit, consistent with NFR-READ-001 |
| Feature-scoped services | Each domain owns its state; reduces coupling between features |
| Error interceptor for global errors | Centralizes 401/403/500 handling; consistent with NFR-ERR-001 |
| Server validation errors mapped to form controls | Surfaces authoritative errors exactly where the user can correct them |
| No `any` types for API responses | Enforces type safety; reduces runtime errors; aligns with NFR-QUAL-001 |
| Lazy-loaded feature routes | Reduces initial bundle size; improves dashboard load time (NFR-PERF-003) |
