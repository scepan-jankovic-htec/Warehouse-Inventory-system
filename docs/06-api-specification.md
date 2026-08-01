# Warehouse Inventory System — REST API Specification

## 1. Document Purpose

This document defines the complete REST API for the Warehouse Inventory System. It specifies every resource, endpoint, HTTP method, request body, response body, status code, error shape, and query parameter convention.

This document is the contract between the backend and the frontend. Both sides shall be implemented to conform to it. No Java code is included.

---

## 2. General Conventions

### 2.1 Base URL

All endpoints are prefixed with `/api`.

```
http://<host>:<port>/api
```

### 2.2 Content Type

All requests and responses use `application/json`.

### 2.3 Authentication

All endpoints require a valid bearer token in the `Authorization` header.

```
Authorization: Bearer <token>
```

Requests without a valid token receive `401 Unauthorized`.

### 2.4 Timestamps

All timestamps are strings in UTC ISO-8601 format: `2026-08-01T10:00:00Z`.

### 2.5 Boolean Fields

Boolean fields are represented as JSON `true` / `false`.

### 2.6 Enumerations

Enum values are uppercase strings. The valid values for each field are documented per endpoint.

---

## 3. Standard Response Envelopes

### 3.1 Single Resource Response

```json
{
  "data": { ... }
}
```

### 3.2 Collection Response (Paginated)

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

### 3.3 Error Response

All error responses — validation failures, business errors, and server errors — use this shape:

```json
{
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Human-readable description of the problem.",
  "timestamp": "2026-08-01T10:00:00Z",
  "fieldErrors": [
    {
      "field": "sku",
      "message": "SKU must not be blank."
    }
  ]
}
```

`fieldErrors` is omitted when not applicable (for example, business rule violations or server errors).

---

## 4. Standard Status Codes

| Code | Meaning | When Used |
|---|---|---|
| `200 OK` | Success | Successful GET, PUT, PATCH |
| `201 Created` | Resource created | Successful POST that creates a new resource |
| `204 No Content` | Success with no body | Successful DELETE or deactivation |
| `400 Bad Request` | Invalid request structure or validation failure | Missing fields, wrong types, constraint violations |
| `401 Unauthorized` | Authentication required or token invalid | Missing or invalid bearer token |
| `403 Forbidden` | Authenticated but not authorized | Role does not permit this operation |
| `404 Not Found` | Resource does not exist | ID not found |
| `409 Conflict` | Duplicate resource | Duplicate SKU, duplicate category name |
| `422 Unprocessable Entity` | Business rule violation | Negative stock, insufficient quantity, inactive resource |
| `500 Internal Server Error` | Unexpected server failure | Unhandled exception |

---

## 5. Pagination, Sorting, and Filtering

### 5.1 Pagination Query Parameters

All collection endpoints support the following parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number (1-based) |
| `size` | integer | `20` | Number of items per page (max 100) |

### 5.2 Sorting Query Parameters

| Parameter | Type | Example | Description |
|---|---|---|---|
| `sortBy` | string | `name` | Field to sort by. Valid values are documented per endpoint. |
| `sortDir` | string | `asc` | Sort direction. Values: `asc`, `desc`. Default: `asc`. |

### 5.3 Filtering

Filtering parameters are endpoint-specific and documented in each endpoint section.

---

## 6. Resources and Endpoints

---

## 6.1 Categories

### Resource: `/api/categories`

---

#### `GET /api/categories`

Returns a paginated list of categories.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Filter by partial name match (case-insensitive) |
| `active` | boolean | Filter by active status. Omit to return all. |
| `sortBy` | string | `name`, `createdAt`. Default: `name` |
| `sortDir` | string | `asc`, `desc`. Default: `asc` |
| `page` | integer | Page number |
| `size` | integer | Page size |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Beverages",
      "description": "All drinkable products",
      "active": true,
      "productCount": 12,
      "createdAt": "2026-07-01T08:00:00Z",
      "updatedAt": "2026-07-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalElements": 5,
    "totalPages": 1
  }
}
```

---

#### `GET /api/categories/{id}`

Returns a single category by ID.

**Path Parameters:** `id` — integer

**Response `200 OK`:**

```json
{
  "data": {
    "id": 1,
    "name": "Beverages",
    "description": "All drinkable products",
    "active": true,
    "productCount": 12,
    "createdAt": "2026-07-01T08:00:00Z",
    "updatedAt": "2026-07-15T10:30:00Z"
  }
}
```

**Response `404 Not Found`** when ID does not exist.

---

#### `POST /api/categories`

Creates a new category.

**Required Role:** `ADMIN`

**Request Body:**

```json
{
  "name": "Beverages",
  "description": "All drinkable products"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | Yes | Not blank, max 100 characters, unique |
| `description` | string | No | Max 500 characters |

**Response `201 Created`:**

```json
{
  "data": {
    "id": 1,
    "name": "Beverages",
    "description": "All drinkable products",
    "active": true,
    "productCount": 0,
    "createdAt": "2026-08-01T10:00:00Z",
    "updatedAt": "2026-08-01T10:00:00Z"
  }
}
```

**Response `409 Conflict`** when name already exists.

---

#### `PUT /api/categories/{id}`

Updates an existing category.

**Required Role:** `ADMIN`

**Request Body:**

```json
{
  "name": "Beverages & Drinks",
  "description": "Updated description"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | Yes | Not blank, max 100 characters, unique |
| `description` | string | No | Max 500 characters |

**Response `200 OK`:** Updated category object (same shape as `GET /api/categories/{id}`).

**Response `404 Not Found`** when ID does not exist.  
**Response `409 Conflict`** when name conflicts with another category.

---

#### `PATCH /api/categories/{id}/deactivate`

Deactivates a category. Products currently assigned to this category retain their association.

**Required Role:** `ADMIN`

**Request Body:** None

**Response `204 No Content`**

**Response `404 Not Found`** when ID does not exist.  
**Response `422 Unprocessable Entity`** when category is already inactive.

---

#### `PATCH /api/categories/{id}/activate`

Reactivates a previously deactivated category.

**Required Role:** `ADMIN`

**Request Body:** None

**Response `204 No Content`**

---

## 6.2 Products

### Resource: `/api/products`

---

#### `GET /api/products`

Returns a paginated list of products.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Filter by partial SKU or name match (case-insensitive) |
| `categoryId` | integer | Filter by category ID |
| `active` | boolean | Filter by active status. Omit to return all. |
| `sortBy` | string | `name`, `sku`, `categoryName`, `createdAt`. Default: `name` |
| `sortDir` | string | `asc`, `desc`. Default: `asc` |
| `page` | integer | Page number |
| `size` | integer | Page size |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 10,
      "sku": "BAT-AA-4P",
      "name": "AA Battery 4-Pack",
      "description": "Alkaline AA batteries, pack of 4",
      "category": {
        "id": 3,
        "name": "Electronics"
      },
      "unitOfMeasure": "PACK",
      "reorderThreshold": 50,
      "active": true,
      "createdAt": "2026-07-10T09:00:00Z",
      "updatedAt": "2026-07-20T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalElements": 120,
    "totalPages": 6
  }
}
```

---

#### `GET /api/products/{id}`

Returns a single product by ID, including current inventory by location.

**Path Parameters:** `id` — integer

**Response `200 OK`:**

```json
{
  "data": {
    "id": 10,
    "sku": "BAT-AA-4P",
    "name": "AA Battery 4-Pack",
    "description": "Alkaline AA batteries, pack of 4",
    "category": {
      "id": 3,
      "name": "Electronics"
    },
    "unitOfMeasure": "PACK",
    "reorderThreshold": 50,
    "active": true,
    "inventory": [
      {
        "locationId": 1,
        "locationName": "Warehouse A",
        "locationType": "WAREHOUSE",
        "quantityOnHand": 240,
        "stockStatus": "IN_STOCK"
      },
      {
        "locationId": 4,
        "locationName": "Store 03",
        "locationType": "STORE",
        "quantityOnHand": 18,
        "stockStatus": "LOW_STOCK"
      }
    ],
    "createdAt": "2026-07-10T09:00:00Z",
    "updatedAt": "2026-07-20T14:00:00Z"
  }
}
```

`stockStatus` values: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`

**Response `404 Not Found`** when ID does not exist.

---

#### `POST /api/products`

Creates a new product.

**Required Role:** `ADMIN`

**Request Body:**

```json
{
  "sku": "BAT-AA-4P",
  "name": "AA Battery 4-Pack",
  "description": "Alkaline AA batteries, pack of 4",
  "categoryId": 3,
  "unitOfMeasure": "PACK",
  "reorderThreshold": 50
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `sku` | string | Yes | Not blank, max 50 characters, unique, uppercase |
| `name` | string | Yes | Not blank, max 200 characters |
| `description` | string | No | Max 1000 characters |
| `categoryId` | integer | Yes | Must reference an existing, active category |
| `unitOfMeasure` | string | Yes | Not blank, max 20 characters |
| `reorderThreshold` | integer | No | ≥ 0. Default: 0 |

**Response `201 Created`:** Created product object (same shape as `GET /api/products/{id}`, with empty `inventory` array).

**Response `409 Conflict`** when SKU already exists.  
**Response `422 Unprocessable Entity`** when `categoryId` references an inactive category.

---

#### `PUT /api/products/{id}`

Updates an existing product. SKU cannot be changed.

**Required Role:** `ADMIN`

**Request Body:**

```json
{
  "name": "AA Battery 4-Pack (Updated)",
  "description": "Updated description",
  "categoryId": 3,
  "unitOfMeasure": "PACK",
  "reorderThreshold": 60
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | Yes | Not blank, max 200 characters |
| `description` | string | No | Max 1000 characters |
| `categoryId` | integer | Yes | Must reference an existing, active category |
| `unitOfMeasure` | string | Yes | Not blank, max 20 characters |
| `reorderThreshold` | integer | No | ≥ 0 |

**Response `200 OK`:** Updated product object.

**Response `404 Not Found`** when ID does not exist.  
**Response `422 Unprocessable Entity`** when `categoryId` references an inactive category.

---

#### `PATCH /api/products/{id}/deactivate`

Deactivates a product. Existing inventory records and history are preserved. New movements are blocked.

**Required Role:** `ADMIN`

**Request Body:** None

**Response `204 No Content`**

**Response `404 Not Found`** when ID does not exist.  
**Response `422 Unprocessable Entity`** when product is already inactive.

---

#### `PATCH /api/products/{id}/activate`

Reactivates a previously deactivated product.

**Required Role:** `ADMIN`

**Request Body:** None

**Response `204 No Content`**

---

## 6.3 Locations

### Resource: `/api/locations`

---

#### `GET /api/locations`

Returns a paginated list of locations.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Filter by partial name match |
| `type` | string | Filter by type: `WAREHOUSE`, `STORE` |
| `active` | boolean | Filter by active status. Omit to return all. |
| `sortBy` | string | `name`, `type`, `createdAt`. Default: `name` |
| `sortDir` | string | `asc`, `desc`. Default: `asc` |
| `page` | integer | Page number |
| `size` | integer | Page size |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Warehouse A",
      "type": "WAREHOUSE",
      "address": "12 Industrial Road, Belgrade",
      "active": true,
      "createdAt": "2026-07-01T08:00:00Z",
      "updatedAt": "2026-07-01T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalElements": 8,
    "totalPages": 1
  }
}
```

---

#### `GET /api/locations/{id}`

Returns a single location by ID.

**Response `200 OK`:** Single location object.  
**Response `404 Not Found`** when ID does not exist.

---

#### `POST /api/locations`

Creates a new location.

**Required Role:** `ADMIN`

**Request Body:**

```json
{
  "name": "Warehouse A",
  "type": "WAREHOUSE",
  "address": "12 Industrial Road, Belgrade"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | Yes | Not blank, max 100 characters, unique |
| `type` | string | Yes | `WAREHOUSE` or `STORE` |
| `address` | string | No | Max 300 characters |

**Response `201 Created`:** Created location object.  
**Response `409 Conflict`** when name already exists.

---

#### `PUT /api/locations/{id}`

Updates an existing location.

**Required Role:** `ADMIN`

**Request Body:** Same fields as `POST /api/locations`.

**Response `200 OK`:** Updated location object.  
**Response `404 Not Found`** when ID does not exist.

---

#### `PATCH /api/locations/{id}/deactivate`

Deactivates a location.

**Required Role:** `ADMIN`

**Response `204 No Content`**

---

#### `PATCH /api/locations/{id}/activate`

Reactivates a location.

**Required Role:** `ADMIN`

**Response `204 No Content`**

---

## 6.4 Inventory

### Resource: `/api/inventory`

---

#### `GET /api/inventory`

Returns a paginated inventory view — one row per product-location combination.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `locationId` | integer | Filter by location |
| `productId` | integer | Filter by product |
| `categoryId` | integer | Filter by product category |
| `stockStatus` | string | Filter by stock state: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK` |
| `search` | string | Filter by product name or SKU (partial, case-insensitive) |
| `sortBy` | string | `productName`, `sku`, `locationName`, `quantityOnHand`, `stockStatus`. Default: `productName` |
| `sortDir` | string | `asc`, `desc`. Default: `asc` |
| `page` | integer | Page number |
| `size` | integer | Page size |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 55,
      "product": {
        "id": 10,
        "sku": "BAT-AA-4P",
        "name": "AA Battery 4-Pack",
        "unitOfMeasure": "PACK",
        "reorderThreshold": 50
      },
      "location": {
        "id": 1,
        "name": "Warehouse A",
        "type": "WAREHOUSE"
      },
      "quantityOnHand": 240,
      "stockStatus": "IN_STOCK",
      "updatedAt": "2026-07-30T16:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalElements": 340,
    "totalPages": 17
  }
}
```

---

#### `GET /api/inventory/{productId}/{locationId}`

Returns the current inventory for a specific product at a specific location.

**Response `200 OK`:** Single inventory object (same shape as above, unwrapped in `data`).  
**Response `404 Not Found`** when the product-location combination has no inventory record.

---

## 6.5 Inventory Movements

### Resource: `/api/inventory/movements`

---

#### `POST /api/inventory/movements/receive`

Records a stock receiving operation. Increases on-hand quantity at the specified location.

**Required Role:** `ADMIN`, `WAREHOUSE_OPERATOR`

**Request Body:**

```json
{
  "productId": 10,
  "locationId": 1,
  "quantity": 120,
  "referenceId": "PO-2026-00841",
  "reason": "Scheduled delivery from supplier"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `productId` | integer | Yes | Must reference an existing, active product |
| `locationId` | integer | Yes | Must reference an existing, active location |
| `quantity` | integer | Yes | > 0 |
| `referenceId` | string | No | Max 100 characters |
| `reason` | string | No | Max 500 characters |

**Response `201 Created`:**

```json
{
  "data": {
    "id": 901,
    "movementType": "RECEIVE",
    "product": {
      "id": 10,
      "sku": "BAT-AA-4P",
      "name": "AA Battery 4-Pack"
    },
    "location": {
      "id": 1,
      "name": "Warehouse A",
      "type": "WAREHOUSE"
    },
    "quantityDelta": 120,
    "quantityAfter": 360,
    "referenceId": "PO-2026-00841",
    "reason": "Scheduled delivery from supplier",
    "performedBy": {
      "id": 5,
      "username": "jdoe",
      "fullName": "John Doe"
    },
    "performedAt": "2026-08-01T10:00:00Z"
  }
}
```

**Response `400 Bad Request`** on validation failure (missing fields, quantity ≤ 0).  
**Response `422 Unprocessable Entity`** when product or location is inactive.

---

#### `POST /api/inventory/movements/transfer`

Records a stock transfer between two locations. Creates two linked movement records (TRANSFER_OUT and TRANSFER_IN).

**Required Role:** `ADMIN`, `WAREHOUSE_OPERATOR`

**Request Body:**

```json
{
  "productId": 10,
  "sourceLocationId": 1,
  "destinationLocationId": 4,
  "quantity": 30,
  "referenceId": "TRF-2026-00112",
  "reason": "Replenishment of Store 03"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `productId` | integer | Yes | Must reference an existing, active product |
| `sourceLocationId` | integer | Yes | Must reference an existing, active location |
| `destinationLocationId` | integer | Yes | Must reference an existing, active location; must differ from `sourceLocationId` |
| `quantity` | integer | Yes | > 0; must not exceed available stock at source |
| `referenceId` | string | No | Max 100 characters |
| `reason` | string | No | Max 500 characters |

**Response `201 Created`:**

```json
{
  "data": {
    "transferId": "TRF-2026-00112",
    "outboundMovement": {
      "id": 902,
      "movementType": "TRANSFER_OUT",
      "location": { "id": 1, "name": "Warehouse A" },
      "quantityDelta": -30,
      "quantityAfter": 210,
      "performedAt": "2026-08-01T10:05:00Z"
    },
    "inboundMovement": {
      "id": 903,
      "movementType": "TRANSFER_IN",
      "location": { "id": 4, "name": "Store 03" },
      "quantityDelta": 30,
      "quantityAfter": 48,
      "performedAt": "2026-08-01T10:05:00Z"
    },
    "product": {
      "id": 10,
      "sku": "BAT-AA-4P",
      "name": "AA Battery 4-Pack"
    },
    "performedBy": {
      "id": 5,
      "username": "jdoe",
      "fullName": "John Doe"
    }
  }
}
```

**Response `400 Bad Request`** when source and destination are the same, or quantity ≤ 0.  
**Response `422 Unprocessable Entity`** when quantity exceeds available stock at source, or product/location is inactive.

---

#### `POST /api/inventory/movements/adjust`

Records a manual stock adjustment. Supports both positive and negative corrections.

**Required Role:** `ADMIN`, `WAREHOUSE_OPERATOR`

**Request Body:**

```json
{
  "productId": 10,
  "locationId": 4,
  "quantityDelta": -5,
  "reason": "Damage write-off — cracked packaging",
  "referenceId": "ADJ-2026-00034"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `productId` | integer | Yes | Must reference an existing, active product |
| `locationId` | integer | Yes | Must reference an existing, active location |
| `quantityDelta` | integer | Yes | Non-zero integer. Positive = stock increase; negative = stock decrease |
| `reason` | string | **Yes** | Not blank, max 500 characters. Always required for adjustments. |
| `referenceId` | string | No | Max 100 characters |

**Response `201 Created`:**

```json
{
  "data": {
    "id": 910,
    "movementType": "ADJUSTMENT",
    "product": {
      "id": 10,
      "sku": "BAT-AA-4P",
      "name": "AA Battery 4-Pack"
    },
    "location": {
      "id": 4,
      "name": "Store 03",
      "type": "STORE"
    },
    "quantityDelta": -5,
    "quantityAfter": 13,
    "reason": "Damage write-off — cracked packaging",
    "referenceId": "ADJ-2026-00034",
    "performedBy": {
      "id": 5,
      "username": "jdoe",
      "fullName": "John Doe"
    },
    "performedAt": "2026-08-01T10:10:00Z"
  }
}
```

**Response `400 Bad Request`** when `reason` is blank or `quantityDelta` is zero.  
**Response `422 Unprocessable Entity`** when the adjustment would result in negative stock, or product/location is inactive.

---

#### `GET /api/inventory/movements`

Returns a paginated list of inventory movement history.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `productId` | integer | Filter by product |
| `locationId` | integer | Filter by location |
| `movementType` | string | Filter by type: `RECEIVE`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT` |
| `performedBy` | integer | Filter by user ID |
| `dateFrom` | string | Filter by date range start (ISO-8601, inclusive) |
| `dateTo` | string | Filter by date range end (ISO-8601, inclusive) |
| `sortBy` | string | `performedAt`, `quantityDelta`. Default: `performedAt` |
| `sortDir` | string | `asc`, `desc`. Default: `desc` |
| `page` | integer | Page number |
| `size` | integer | Page size |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 901,
      "movementType": "RECEIVE",
      "product": {
        "id": 10,
        "sku": "BAT-AA-4P",
        "name": "AA Battery 4-Pack"
      },
      "location": {
        "id": 1,
        "name": "Warehouse A",
        "type": "WAREHOUSE"
      },
      "quantityDelta": 120,
      "referenceId": "PO-2026-00841",
      "reason": "Scheduled delivery from supplier",
      "transferCounterpartId": null,
      "performedBy": {
        "id": 5,
        "username": "jdoe",
        "fullName": "John Doe"
      },
      "performedAt": "2026-08-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalElements": 4200,
    "totalPages": 210
  }
}
```

**Response `400 Bad Request`** when `dateFrom` is after `dateTo`.

---

#### `GET /api/inventory/movements/{id}`

Returns a single movement record by ID.

**Response `200 OK`:** Single movement object (same shape as above).  
**Response `404 Not Found`** when ID does not exist.

---

## 6.6 Dashboard

### Resource: `/api/dashboard`

---

#### `GET /api/dashboard/summary`

Returns high-level inventory metrics for the dashboard.

**Response `200 OK`:**

```json
{
  "data": {
    "totalActiveProducts": 148,
    "totalActiveLocations": 8,
    "lowStockCount": 12,
    "outOfStockCount": 3,
    "recentMovements": [
      {
        "id": 910,
        "movementType": "ADJUSTMENT",
        "productName": "AA Battery 4-Pack",
        "locationName": "Store 03",
        "quantityDelta": -5,
        "performedAt": "2026-08-01T10:10:00Z"
      }
    ]
  }
}
```

`recentMovements` returns the 10 most recent movements across all products and locations.

---

#### `GET /api/dashboard/stock-health`

Returns stock health distribution broken down by location.

**Response `200 OK`:**

```json
{
  "data": [
    {
      "location": {
        "id": 1,
        "name": "Warehouse A",
        "type": "WAREHOUSE"
      },
      "inStockCount": 130,
      "lowStockCount": 10,
      "outOfStockCount": 2
    },
    {
      "location": {
        "id": 4,
        "name": "Store 03",
        "type": "STORE"
      },
      "inStockCount": 88,
      "lowStockCount": 5,
      "outOfStockCount": 1
    }
  ]
}
```

---

## 6.7 Users

### Resource: `/api/users`

---

#### `GET /api/users`

Returns a paginated list of users.

**Required Role:** `ADMIN`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Filter by partial username or full name |
| `role` | string | Filter by role: `ADMIN`, `WAREHOUSE_OPERATOR`, `STORE_OPERATOR`, `MANAGER` |
| `active` | boolean | Filter by active status |
| `sortBy` | string | `username`, `fullName`, `role`. Default: `username` |
| `sortDir` | string | `asc`, `desc`. Default: `asc` |
| `page` | integer | Page number |
| `size` | integer | Page size |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 5,
      "username": "jdoe",
      "fullName": "John Doe",
      "email": "j.doe@example.com",
      "role": "WAREHOUSE_OPERATOR",
      "active": true,
      "createdAt": "2026-07-01T08:00:00Z",
      "updatedAt": "2026-07-01T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalElements": 15,
    "totalPages": 1
  }
}
```

---

#### `GET /api/users/{id}`

Returns a single user. Password hash is never included in any response.

**Required Role:** `ADMIN`

**Response `200 OK`:** Single user object.  
**Response `404 Not Found`** when ID does not exist.

---

#### `POST /api/users`

Creates a new user account.

**Required Role:** `ADMIN`

**Request Body:**

```json
{
  "username": "jdoe",
  "password": "TemporaryPass1!",
  "fullName": "John Doe",
  "email": "j.doe@example.com",
  "role": "WAREHOUSE_OPERATOR"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | Yes | Not blank, max 50 characters, unique |
| `password` | string | Yes | Min 8 characters |
| `fullName` | string | Yes | Not blank, max 100 characters |
| `email` | string | Yes | Valid email format, unique |
| `role` | string | Yes | `ADMIN`, `WAREHOUSE_OPERATOR`, `STORE_OPERATOR`, `MANAGER` |

**Response `201 Created`:** Created user object (no password in response).  
**Response `409 Conflict`** when username or email already exists.

---

#### `PUT /api/users/{id}`

Updates a user's profile. Password is updated separately.

**Required Role:** `ADMIN`

**Request Body:**

```json
{
  "fullName": "John M. Doe",
  "email": "jm.doe@example.com",
  "role": "MANAGER"
}
```

**Response `200 OK`:** Updated user object.  
**Response `404 Not Found`** when ID does not exist.

---

#### `PATCH /api/users/{id}/deactivate`

Deactivates a user account. The user cannot perform operations while inactive.

**Required Role:** `ADMIN`

**Response `204 No Content`**

---

#### `PATCH /api/users/{id}/activate`

Reactivates a user account.

**Required Role:** `ADMIN`

**Response `204 No Content`**

---

## 7. Validation Error Reference

All `400 Bad Request` validation failures return the standard error shape with `fieldErrors` populated.

**Example — missing required fields:**

```json
{
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Request contains invalid fields.",
  "timestamp": "2026-08-01T10:00:00Z",
  "fieldErrors": [
    { "field": "sku", "message": "SKU must not be blank." },
    { "field": "categoryId", "message": "Category ID is required." }
  ]
}
```

**Example — business rule violation (422):**

```json
{
  "status": 422,
  "error": "INSUFFICIENT_STOCK",
  "message": "Transfer quantity (30) exceeds available stock (18) at Warehouse A.",
  "timestamp": "2026-08-01T10:05:00Z"
}
```

**Example — duplicate resource (409):**

```json
{
  "status": 409,
  "error": "DUPLICATE_RESOURCE",
  "message": "A product with SKU 'BAT-AA-4P' already exists.",
  "timestamp": "2026-08-01T10:00:00Z"
}
```

---

## 8. Error Code Reference

| Error Code | Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | One or more request fields failed validation |
| `UNAUTHORIZED` | 401 | No valid authentication token provided |
| `FORBIDDEN` | 403 | Authenticated user lacks required role |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource ID does not exist |
| `DUPLICATE_RESOURCE` | 409 | Unique constraint violated (SKU, name, email) |
| `INSUFFICIENT_STOCK` | 422 | Transfer or adjustment would result in negative stock |
| `INACTIVE_RESOURCE` | 422 | Operation attempted on a deactivated product, location, or category |
| `INVALID_TRANSFER` | 422 | Source and destination locations are identical |
| `ALREADY_INACTIVE` | 422 | Deactivation attempted on an already-inactive resource |
| `INTERNAL_ERROR` | 500 | Unexpected server-side failure |

---

## 9. Endpoint Summary

| Method | Endpoint | Description | Min. Role |
|---|---|---|---|
| `GET` | `/api/categories` | List categories | Any |
| `GET` | `/api/categories/{id}` | Get category | Any |
| `POST` | `/api/categories` | Create category | ADMIN |
| `PUT` | `/api/categories/{id}` | Update category | ADMIN |
| `PATCH` | `/api/categories/{id}/deactivate` | Deactivate category | ADMIN |
| `PATCH` | `/api/categories/{id}/activate` | Activate category | ADMIN |
| `GET` | `/api/products` | List products | Any |
| `GET` | `/api/products/{id}` | Get product with inventory | Any |
| `POST` | `/api/products` | Create product | ADMIN |
| `PUT` | `/api/products/{id}` | Update product | ADMIN |
| `PATCH` | `/api/products/{id}/deactivate` | Deactivate product | ADMIN |
| `PATCH` | `/api/products/{id}/activate` | Activate product | ADMIN |
| `GET` | `/api/locations` | List locations | Any |
| `GET` | `/api/locations/{id}` | Get location | Any |
| `POST` | `/api/locations` | Create location | ADMIN |
| `PUT` | `/api/locations/{id}` | Update location | ADMIN |
| `PATCH` | `/api/locations/{id}/deactivate` | Deactivate location | ADMIN |
| `PATCH` | `/api/locations/{id}/activate` | Activate location | ADMIN |
| `GET` | `/api/inventory` | List inventory by product-location | Any |
| `GET` | `/api/inventory/{productId}/{locationId}` | Get specific inventory record | Any |
| `POST` | `/api/inventory/movements/receive` | Receive stock | ADMIN, WAREHOUSE_OPERATOR |
| `POST` | `/api/inventory/movements/transfer` | Transfer stock | ADMIN, WAREHOUSE_OPERATOR |
| `POST` | `/api/inventory/movements/adjust` | Adjust stock | ADMIN, WAREHOUSE_OPERATOR |
| `GET` | `/api/inventory/movements` | List movement history | Any |
| `GET` | `/api/inventory/movements/{id}` | Get movement record | Any |
| `GET` | `/api/dashboard/summary` | Dashboard summary metrics | Any |
| `GET` | `/api/dashboard/stock-health` | Stock health by location | Any |
| `GET` | `/api/users` | List users | ADMIN |
| `GET` | `/api/users/{id}` | Get user | ADMIN |
| `POST` | `/api/users` | Create user | ADMIN |
| `PUT` | `/api/users/{id}` | Update user | ADMIN |
| `PATCH` | `/api/users/{id}/deactivate` | Deactivate user | ADMIN |
| `PATCH` | `/api/users/{id}/activate` | Activate user | ADMIN |
