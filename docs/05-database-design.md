# Warehouse Inventory System — Database Design

## 1. Document Purpose

This document describes the complete database design for the Warehouse Inventory System. It defines every table, column, primary key, foreign key, constraint, index, and normalization decision, along with the business rules enforced at the data layer.

No SQL is included. This document is a design specification consumed by implementation.

---

## 2. Design Principles

- The schema is in **Third Normal Form (3NF)**. Every non-key attribute depends only on the primary key, not on other non-key attributes.
- All primary keys are surrogate integer identifiers. Business identifiers (such as SKU) are modeled as unique natural keys but are not used as foreign keys.
- Historical records are never deleted. Soft deletion via an `is_active` flag is used for products, categories, and locations.
- Inventory quantity is stored as a derived-but-persisted aggregate in `inventory`. The ground truth for reconstruction is always `inventory_movement`.
- Timestamps are stored in UTC ISO-8601 format.

---

## 3. Entity Relationship Overview

```
category ──< product >── inventory >── inventory_movement
                │                              │
             location ─────────────────────────┘
                │
           app_user ────────────────────────────▶ inventory_movement
```

**Reading:**
- A `category` has many `products`.
- A `product` has one `category`.
- An `inventory` record represents on-hand stock for one `product` at one `location` (composite unique constraint).
- An `inventory_movement` records each stock change and links to `product`, `location`, and `app_user`.
- Transfer movements reference two locations (source and destination).

---

## 4. Tables

---

### 4.1 `category`

**Purpose:**  
Stores the product classification hierarchy. Categories organize products for navigation, filtering, and reporting. A category can be deactivated to prevent new use without removing historical associations.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | INTEGER | No | PRIMARY KEY, AUTOINCREMENT | Surrogate identifier |
| `name` | TEXT | No | NOT NULL, UNIQUE | Display name of the category |
| `description` | TEXT | Yes | — | Optional human-readable description |
| `is_active` | INTEGER | No | NOT NULL, DEFAULT 1, CHECK (0 or 1) | Soft delete flag |
| `created_at` | TEXT | No | NOT NULL | UTC timestamp of creation |
| `updated_at` | TEXT | No | NOT NULL | UTC timestamp of last update |

**Constraints:**
- `name` must be unique across all categories (active and inactive).
- `is_active` must be 0 or 1 (SQLite boolean convention).

**Indexes:**
- `idx_category_name` on `name` — supports lookup and duplicate detection.
- `idx_category_is_active` on `is_active` — supports filtering active categories.

**Business rules enforced:**
- A category cannot be physically removed if products reference it.
- Deactivation is represented by setting `is_active = 0`.

---

### 4.2 `product`

**Purpose:**  
Stores the product catalog. Each product is a distinct item that can be stocked across one or more locations. The SKU is the stable natural business key. Products can be deactivated to prevent new inventory operations while preserving history.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | INTEGER | No | PRIMARY KEY, AUTOINCREMENT | Surrogate identifier |
| `sku` | TEXT | No | NOT NULL, UNIQUE | Business identifier — stable, unique, uppercase |
| `name` | TEXT | No | NOT NULL | Display name |
| `description` | TEXT | Yes | — | Optional product description |
| `category_id` | INTEGER | No | NOT NULL, FOREIGN KEY → category(id) | Owning category |
| `unit_of_measure` | TEXT | No | NOT NULL | Unit in which stock is counted (e.g., "EACH", "BOX", "KG") |
| `reorder_threshold` | INTEGER | No | NOT NULL, DEFAULT 0, CHECK (≥ 0) | Quantity below which low-stock alert is triggered |
| `is_active` | INTEGER | No | NOT NULL, DEFAULT 1, CHECK (0 or 1) | Soft delete flag |
| `created_at` | TEXT | No | NOT NULL | UTC timestamp of creation |
| `updated_at` | TEXT | No | NOT NULL | UTC timestamp of last update |

**Constraints:**
- `sku` must be unique across all products (active and inactive).
- `category_id` must reference an existing category.
- `reorder_threshold` must be ≥ 0.
- `is_active` must be 0 or 1.

**Indexes:**
- `idx_product_sku` on `sku` — primary lookup, uniqueness enforcement.
- `idx_product_category_id` on `category_id` — supports category-filtered product queries.
- `idx_product_is_active` on `is_active` — supports filtering active products.
- `idx_product_name` on `name` — supports name search and sorting.

**Business rules enforced:**
- SKU is unique and immutable once in use (enforced at application layer with UNIQUE constraint as backing guarantee).
- Products referencing a deactivated category retain the foreign key; the application prevents further assignment to inactive categories.
- Deleting a product record is not permitted if inventory or movement records reference it.

**Normalization note:**  
`unit_of_measure` is stored as a text value on the product rather than a separate lookup table. If the domain requires a controlled vocabulary, this can be extended to a reference table without structural redesign.

---

### 4.3 `location`

**Purpose:**  
Represents a physical location where inventory is held. A location can be a warehouse, a retail store floor, or a storage zone. Locations can be deactivated when no longer in use.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | INTEGER | No | PRIMARY KEY, AUTOINCREMENT | Surrogate identifier |
| `name` | TEXT | No | NOT NULL, UNIQUE | Display name of the location |
| `type` | TEXT | No | NOT NULL, CHECK in ('WAREHOUSE', 'STORE') | Distinguishes warehouse from retail store |
| `address` | TEXT | Yes | — | Optional physical address |
| `is_active` | INTEGER | No | NOT NULL, DEFAULT 1, CHECK (0 or 1) | Soft delete flag |
| `created_at` | TEXT | No | NOT NULL | UTC timestamp of creation |
| `updated_at` | TEXT | No | NOT NULL | UTC timestamp of last update |

**Constraints:**
- `name` must be unique.
- `type` must be one of: `WAREHOUSE`, `STORE`.
- `is_active` must be 0 or 1.

**Indexes:**
- `idx_location_name` on `name` — supports lookup.
- `idx_location_type` on `type` — supports type-filtered queries.
- `idx_location_is_active` on `is_active` — supports filtering active locations.

**Business rules enforced:**
- Deactivated locations cannot be selected for new movements (enforced at application layer; the unique constraint and foreign keys remain intact).

---

### 4.4 `inventory`

**Purpose:**  
Stores the current on-hand stock quantity for each combination of product and location. This is the authoritative, up-to-date quantity record that drives dashboard metrics and stock-state evaluations. Each row represents a unique product-location pair.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | INTEGER | No | PRIMARY KEY, AUTOINCREMENT | Surrogate identifier |
| `product_id` | INTEGER | No | NOT NULL, FOREIGN KEY → product(id) | Product being tracked |
| `location_id` | INTEGER | No | NOT NULL, FOREIGN KEY → location(id) | Location holding the stock |
| `quantity_on_hand` | INTEGER | No | NOT NULL, DEFAULT 0, CHECK (≥ 0) | Current stock quantity |
| `created_at` | TEXT | No | NOT NULL | UTC timestamp of record creation |
| `updated_at` | TEXT | No | NOT NULL | UTC timestamp of last quantity update |

**Constraints:**
- `(product_id, location_id)` composite UNIQUE constraint — one inventory record per product-location pair.
- `quantity_on_hand` must be ≥ 0. This constraint enforces the business rule that stock cannot go negative.
- Both foreign keys must reference existing records.

**Indexes:**
- `idx_inventory_product_id` on `product_id` — supports product-level inventory queries.
- `idx_inventory_location_id` on `location_id` — supports location-level inventory views.
- `idx_inventory_product_location` on `(product_id, location_id)` — composite index supporting the unique constraint and join-based lookups.

**Business rules enforced:**
- `CHECK (quantity_on_hand >= 0)` directly enforces FR-INV-005 (Prevent Negative Inventory) at the database level as a safety net.
- An inventory row is created when a product first receives stock at a location.

**Normalization note:**  
`quantity_on_hand` is technically derivable by summing all `inventory_movement` records for a product-location pair. However, it is persisted here to avoid full history scans on every stock query, which is critical for performance (NFR-PERF-001, NFR-PERF-002).

---

### 4.5 `inventory_movement`

**Purpose:**  
Records every stock change event as an immutable audit entry. This table is the complete audit trail for all receiving, transfer, and adjustment operations. Records are never updated or deleted. Each movement captures who performed it, what changed, where, and why.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | INTEGER | No | PRIMARY KEY, AUTOINCREMENT | Surrogate identifier |
| `product_id` | INTEGER | No | NOT NULL, FOREIGN KEY → product(id) | Product involved in the movement |
| `location_id` | INTEGER | No | NOT NULL, FOREIGN KEY → location(id) | Location where quantity changed |
| `movement_type` | TEXT | No | NOT NULL, CHECK in ('RECEIVE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT') | Type of stock movement |
| `quantity_delta` | INTEGER | No | NOT NULL, CHECK (≠ 0) | Signed quantity change. Positive = increase, negative = decrease |
| `reference_id` | TEXT | Yes | — | Optional external reference (e.g., purchase order number, transfer batch ID) |
| `reason` | TEXT | Yes | — | Business reason. Required for ADJUSTMENT type (enforced at application layer) |
| `transfer_counterpart_id` | INTEGER | Yes | FOREIGN KEY → inventory_movement(id) | Links TRANSFER_OUT to its paired TRANSFER_IN record |
| `performed_by` | INTEGER | No | NOT NULL, FOREIGN KEY → app_user(id) | User who performed the action |
| `performed_at` | TEXT | No | NOT NULL | UTC timestamp of the movement |

**Constraints:**
- `movement_type` must be one of: `RECEIVE`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT`.
- `quantity_delta` must not be zero. Positive values represent stock increases; negative values represent decreases.
- `transfer_counterpart_id` self-referencing foreign key links the two legs of a transfer.
- `performed_by` must reference an existing user.

**Indexes:**
- `idx_movement_product_id` on `product_id` — supports product history queries.
- `idx_movement_location_id` on `location_id` — supports location history queries.
- `idx_movement_performed_at` on `performed_at` — supports chronological history and date-range filtering.
- `idx_movement_type` on `movement_type` — supports movement-type filtering.
- `idx_movement_performed_by` on `performed_by` — supports actor-based audit queries.
- `idx_movement_product_location_at` on `(product_id, location_id, performed_at)` — composite index supporting the most common history query pattern.

**Business rules enforced:**
- Records are immutable once written. No UPDATE or DELETE operations are permitted on this table.
- A transfer is always represented as exactly two records: one `TRANSFER_OUT` at the source location and one `TRANSFER_IN` at the destination location, linked via `transfer_counterpart_id`.
- `quantity_delta != 0` prevents zero-effect noise records.

---

### 4.6 `app_user`

**Purpose:**  
Stores application user accounts. Each user has an assigned role that governs which operations they may perform. This table is the actor reference for all inventory movement records.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | INTEGER | No | PRIMARY KEY, AUTOINCREMENT | Surrogate identifier |
| `username` | TEXT | No | NOT NULL, UNIQUE | Login identifier |
| `password_hash` | TEXT | No | NOT NULL | Hashed credential — never stored as plaintext |
| `full_name` | TEXT | No | NOT NULL | Display name |
| `email` | TEXT | No | NOT NULL, UNIQUE | Contact address |
| `role` | TEXT | No | NOT NULL, CHECK in ('ADMIN', 'WAREHOUSE_OPERATOR', 'STORE_OPERATOR', 'MANAGER') | User role |
| `is_active` | INTEGER | No | NOT NULL, DEFAULT 1, CHECK (0 or 1) | Soft delete / account suspension flag |
| `created_at` | TEXT | No | NOT NULL | UTC timestamp of creation |
| `updated_at` | TEXT | No | NOT NULL | UTC timestamp of last update |

**Constraints:**
- `username` and `email` must each be unique.
- `role` must be one of: `ADMIN`, `WAREHOUSE_OPERATOR`, `STORE_OPERATOR`, `MANAGER`.
- `password_hash` must never contain a plaintext password.
- `is_active` must be 0 or 1.

**Indexes:**
- `idx_user_username` on `username` — authentication lookup.
- `idx_user_email` on `email` — uniqueness enforcement and lookup.
- `idx_user_role` on `role` — role-based access queries.

**Business rules enforced:**
- A deactivated user (`is_active = 0`) cannot perform inventory operations (enforced at application layer).
- Deleting a user record is not permitted if movement records reference them, preserving audit trail integrity.

---

## 5. Relationships Summary

```
category ──(1:N)──> product
product  ──(1:N)──> inventory
location ──(1:N)──> inventory
product  ──(1:N)──> inventory_movement
location ──(1:N)──> inventory_movement
app_user ──(1:N)──> inventory_movement
inventory_movement ──(0:1 self-ref)──> inventory_movement  [transfer counterpart]
```

| Relationship | Cardinality | Foreign Key |
|---|---|---|
| category → product | One-to-many | `product.category_id` |
| product → inventory | One-to-many | `inventory.product_id` |
| location → inventory | One-to-many | `inventory.location_id` |
| product → inventory_movement | One-to-many | `inventory_movement.product_id` |
| location → inventory_movement | One-to-many | `inventory_movement.location_id` |
| app_user → inventory_movement | One-to-many | `inventory_movement.performed_by` |
| inventory_movement → inventory_movement | Self-referential (0 or 1) | `inventory_movement.transfer_counterpart_id` |

---

## 6. Normalization

| Normal Form | Status | Notes |
|---|---|---|
| 1NF | ✓ | All columns are atomic; no repeating groups |
| 2NF | ✓ | All non-key attributes depend on the full primary key |
| 3NF | ✓ | No transitive dependencies between non-key attributes |

**Notable design decisions:**

- `quantity_on_hand` in `inventory` is a persisted denormalization for performance. It duplicates information derivable from `inventory_movement` but is kept synchronized by the application service layer as part of every movement transaction.
- `unit_of_measure` is stored inline on `product` rather than in a separate reference table. This is a deliberate simplification acceptable at this stage of the project.
- `movement_type` is stored as a text CHECK constraint rather than a foreign key to a type reference table, consistent with SQLite conventions for controlled enumerations.

---

## 7. Database-Level Business Rules

| Rule | Enforcement | Source |
|---|---|---|
| Inventory quantity cannot be negative | `CHECK (quantity_on_hand >= 0)` on `inventory` | FR-INV-005 |
| Product SKU must be unique | `UNIQUE` on `product.sku` | FR-PROD-001, Business Rule 3 |
| Category name must be unique | `UNIQUE` on `category.name` | FR-CAT-001 |
| Location name must be unique | `UNIQUE` on `location.name` | FR-INV-001 |
| Movement quantity delta cannot be zero | `CHECK (quantity_delta != 0)` on `inventory_movement` | FR-HIST-001 |
| Movement type is a controlled value | `CHECK` on `inventory_movement.movement_type` | FR-HIST-001 |
| User role is a controlled value | `CHECK` on `app_user.role` | Business Rule 7 |
| Location type is a controlled value | `CHECK` on `location.type` | FR-INV-001 |
| Passwords are never stored as plaintext | Application-enforced; `password_hash` column name documents intent | NFR-SEC-003 |
| Audit records are immutable | Application-enforced; no UPDATE/DELETE paths in repository layer | FR-HIST-004, Business Rule 1 |
| One inventory record per product-location pair | Composite `UNIQUE (product_id, location_id)` on `inventory` | FR-INV-001 |

---

## 8. Index Strategy Summary

The following indexes are defined to support the primary query patterns derived from the functional requirements:

| Table | Index | Supports |
|---|---|---|
| `category` | `name`, `is_active` | Category lookup, active filter |
| `product` | `sku`, `category_id`, `is_active`, `name` | SKU lookup, category filter, active filter, name sort |
| `location` | `name`, `type`, `is_active` | Location lookup, type filter, active filter |
| `inventory` | `product_id`, `location_id`, `(product_id, location_id)` | Stock by product, stock by location, unique constraint |
| `inventory_movement` | `product_id`, `location_id`, `performed_at`, `movement_type`, `performed_by`, `(product_id, location_id, performed_at)` | History queries, date filtering, type filtering, audit queries |
| `app_user` | `username`, `email`, `role` | Authentication, uniqueness, role queries |

---

## 9. Data Retention and Integrity Notes

1. **Soft deletion only.** Products, categories, locations, and users use `is_active` flags. No records are hard-deleted.
2. **Movement records are permanent.** `inventory_movement` rows are immutable and never deleted, preserving the complete audit trail required by FR-HIST-004.
3. **Foreign key integrity must be enabled.** SQLite requires `PRAGMA foreign_keys = ON` at runtime to enforce foreign key constraints. This must be configured in the application data source.
4. **Referential consistency.** Deleting a parent record (product, category, location, user) that is referenced by child records is prevented by foreign key constraints.
