# Warehouse Inventory System — Backend API

## Base URL

```
http://localhost:8080/api
```

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <your_token>
```

## Auth and Login in Postman

### Important note

This backend currently expects JWT authentication, but it does not expose a login controller in the codebase yet. That means you must first obtain a valid JWT token from the authentication flow available in your environment before calling protected endpoints.

If your environment already has a login endpoint, use it exactly as described below. If it does not, you cannot guess the token — the backend must provide one through a login flow or a test/dev token issued by the auth setup.

### Step 1 — Log in and get a token

1. Open Postman.
2. Create a new request for your login endpoint.
3. Set the method to `POST`.
4. Enter the login URL provided by your backend auth setup, for example:

  ```
  POST http://localhost:8080/api/auth/login
  ```

5. Set `Content-Type` to `application/json`.
6. Send the login payload with your username and password.

  Example:

  ```json
  {
    "username": "jdoe",
    "password": "TemporaryPass1!"
  }
  ```

7. Click **Send**.
8. Copy the JWT token from the response body.

### Step 2 — Use the token in protected requests

You can add the token in Postman in either of these ways:

#### Option A: Authorization tab

1. Open any protected request, for example `GET /api/categories`.
2. Go to the **Authorization** tab.
3. Set **Type** to **Bearer Token**.
4. Paste the token into the **Token** field.
5. Send the request.

Postman will automatically add this header:

```http
Authorization: Bearer <your_token>
```

#### Option B: Headers tab

1. Open the **Headers** tab.
2. Add this header:

  - Key: `Authorization`
  - Value: `Bearer <your_token>`

3. Send the request.

#### Option C: Environment variable

1. Save the token in a Postman environment variable, for example `token`.
2. Use `Bearer {{token}}` in the Authorization tab or Headers tab.

### Step 3 — Verify the token works

Test with a simple `GET` request first, such as:

```
GET http://localhost:8080/api/categories
```

If the token is valid, you should receive `200 OK` and a response body.
If the token is missing or invalid, you should receive `401 Unauthorized`.

### Example protected request

```
GET http://localhost:8080/api/categories
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

---

## Contents

- [Categories](#categories)
- [Products](#products)
- [Locations](#locations)
- [Inventory](#inventory)
- [Inventory Movements](#inventory-movements)
- [Dashboard](#dashboard)
- [Users](#users)

---

## Categories

### GET /api/categories

Returns a paginated list of categories.

**Query Parameters (all optional):**

| Parameter | Example |
|-----------|---------|
| `search`  | `Bev`   |
| `active`  | `true`  |
| `sortBy`  | `name`  |
| `sortDir` | `asc`   |
| `page`    | `1`     |
| `size`    | `20`    |

**Postman:**
```
GET http://localhost:8080/api/categories?active=true&sortBy=name&sortDir=asc&page=1&size=20
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Beverages",
      "description": "All drinkable products",
      "active": true,
      "productCount": 12,
      "createdAt": "2026-07-01T08:00:00",
      "updatedAt": "2026-07-15T10:30:00"
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

### GET /api/categories/{id}

Returns a single category.

**Postman:**
```
GET http://localhost:8080/api/categories/1
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
```json
{
  "data": {
    "id": 1,
    "name": "Beverages",
    "description": "All drinkable products",
    "active": true,
    "productCount": 12,
    "createdAt": "2026-07-01T08:00:00",
    "updatedAt": "2026-07-15T10:30:00"
  }
}
```

---

### POST /api/categories

Creates a new category. **Requires ADMIN role.**

**Postman:**
```
POST http://localhost:8080/api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Beverages",
  "description": "All drinkable products"
}
```

| Field         | Type   | Required | Constraints              |
|---------------|--------|----------|--------------------------|
| `name`        | string | Yes      | Not blank, max 100 chars |
| `description` | string | No       | Max 500 chars            |

**Example Response `201 Created`:**
```json
{
  "data": {
    "id": 1,
    "name": "Beverages",
    "description": "All drinkable products",
    "active": true,
    "productCount": 0,
    "createdAt": "2026-08-01T10:00:00",
    "updatedAt": "2026-08-01T10:00:00"
  }
}
```

---

### PUT /api/categories/{id}

Updates an existing category. **Requires ADMIN role.**

**Postman:**
```
PUT http://localhost:8080/api/categories/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Beverages & Drinks",
  "description": "Updated description"
}
```

**Example Response `200 OK`:** Same shape as GET by ID.

---

### PATCH /api/categories/{id}/deactivate

Deactivates a category. **Requires ADMIN role.**

**Postman:**
```
PATCH http://localhost:8080/api/categories/1/deactivate
Authorization: Bearer <token>
```

**Response `204 No Content`** (empty body)

---

### PATCH /api/categories/{id}/activate

Reactivates a category. **Requires ADMIN role.**

**Postman:**
```
PATCH http://localhost:8080/api/categories/1/activate
Authorization: Bearer <token>
```

**Response `204 No Content`** (empty body)

---

## Products

### GET /api/products

Returns a paginated list of products.

**Query Parameters (all optional):**

| Parameter    | Example |
|--------------|---------|
| `search`     | `Battery` |
| `categoryId` | `3`     |
| `active`     | `true`  |
| `sortBy`     | `name`  |
| `sortDir`    | `asc`   |
| `page`       | `1`     |
| `size`       | `20`    |

**Postman:**
```
GET http://localhost:8080/api/products?search=Battery&active=true&page=1&size=20
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
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
      "createdAt": "2026-07-10T09:00:00",
      "updatedAt": "2026-07-20T14:00:00"
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

### GET /api/products/{id}

Returns a single product with current inventory per location.

**Postman:**
```
GET http://localhost:8080/api/products/10
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
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
    "createdAt": "2026-07-10T09:00:00",
    "updatedAt": "2026-07-20T14:00:00"
  }
}
```

---

### POST /api/products

Creates a new product. **Requires ADMIN role.**

**Postman:**
```
POST http://localhost:8080/api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "BAT-AA-4P",
  "name": "AA Battery 4-Pack",
  "description": "Alkaline AA batteries, pack of 4",
  "categoryId": 3,
  "unitOfMeasure": "PACK",
  "reorderThreshold": 50
}
```

| Field              | Type    | Required | Constraints                          |
|--------------------|---------|----------|--------------------------------------|
| `sku`              | string  | Yes      | Not blank, max 50 chars, unique      |
| `name`             | string  | Yes      | Not blank, max 200 chars             |
| `description`      | string  | No       | Max 1000 chars                       |
| `categoryId`       | integer | Yes      | Must reference an active category    |
| `unitOfMeasure`    | string  | Yes      | Not blank, max 20 chars              |
| `reorderThreshold` | integer | No       | ≥ 0, default 0                       |

**Example Response `201 Created`:** Same shape as GET by ID, with empty `inventory` array.

---

### PUT /api/products/{id}

Updates an existing product. SKU cannot be changed. **Requires ADMIN role.**

**Postman:**
```
PUT http://localhost:8080/api/products/10
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "AA Battery 4-Pack (Updated)",
  "description": "Updated description",
  "categoryId": 3,
  "unitOfMeasure": "PACK",
  "reorderThreshold": 60
}
```

**Example Response `200 OK`:** Same shape as GET by ID.

---

### PATCH /api/products/{id}/deactivate

Deactivates a product. **Requires ADMIN role.**

**Postman:**
```
PATCH http://localhost:8080/api/products/10/deactivate
Authorization: Bearer <token>
```

**Response `204 No Content`** (empty body)

---

### PATCH /api/products/{id}/activate

Reactivates a product. **Requires ADMIN role.**

**Postman:**
```
PATCH http://localhost:8080/api/products/10/activate
Authorization: Bearer <token>
```

**Response `204 No Content`** (empty body)

---

## Locations

### GET /api/locations

Returns a paginated list of locations.

**Query Parameters (all optional):**

| Parameter | Example      |
|-----------|--------------|
| `search`  | `Warehouse`  |
| `type`    | `WAREHOUSE`  |
| `active`  | `true`       |
| `sortBy`  | `name`       |
| `sortDir` | `asc`        |
| `page`    | `1`          |
| `size`    | `20`         |

`type` values: `WAREHOUSE`, `STORE`

**Postman:**
```
GET http://localhost:8080/api/locations?type=WAREHOUSE&active=true&page=1&size=20
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Warehouse A",
      "type": "WAREHOUSE",
      "address": "12 Industrial Road, Belgrade",
      "active": true,
      "createdAt": "2026-07-01T08:00:00",
      "updatedAt": "2026-07-01T08:00:00"
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

### GET /api/locations/{id}

Returns a single location.

**Postman:**
```
GET http://localhost:8080/api/locations/1
Authorization: Bearer <token>
```

---

### POST /api/locations

Creates a new location. **Requires ADMIN role.**

**Postman:**
```
POST http://localhost:8080/api/locations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Warehouse A",
  "type": "WAREHOUSE",
  "address": "12 Industrial Road, Belgrade"
}
```

| Field     | Type   | Required | Constraints                      |
|-----------|--------|----------|----------------------------------|
| `name`    | string | Yes      | Not blank, max 100 chars, unique |
| `type`    | string | Yes      | `WAREHOUSE` or `STORE`           |
| `address` | string | No       | Max 300 chars                    |

**Example Response `201 Created`:**
```json
{
  "data": {
    "id": 1,
    "name": "Warehouse A",
    "type": "WAREHOUSE",
    "address": "12 Industrial Road, Belgrade",
    "active": true,
    "createdAt": "2026-08-01T10:00:00",
    "updatedAt": "2026-08-01T10:00:00"
  }
}
```

---

### PUT /api/locations/{id}

Updates a location. **Requires ADMIN role.**

**Postman:**
```
PUT http://localhost:8080/api/locations/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Warehouse A (Main)",
  "type": "WAREHOUSE",
  "address": "12 Industrial Road, Belgrade"
}
```

**Example Response `200 OK`:** Same shape as GET by ID.

---

### PATCH /api/locations/{id}/deactivate

Deactivates a location. **Requires ADMIN role.**

**Postman:**
```
PATCH http://localhost:8080/api/locations/1/deactivate
Authorization: Bearer <token>
```

**Response `204 No Content`** (empty body)

---

### PATCH /api/locations/{id}/activate

Reactivates a location. **Requires ADMIN role.**

**Postman:**
```
PATCH http://localhost:8080/api/locations/1/activate
Authorization: Bearer <token>
```

**Response `204 No Content`** (empty body)

---

## Inventory

### GET /api/inventory

Returns a paginated inventory view — one row per product-location pair.

**Query Parameters (all optional):**

| Parameter     | Example        |
|---------------|----------------|
| `locationId`  | `1`            |
| `productId`   | `10`           |
| `categoryId`  | `3`            |
| `stockStatus` | `LOW_STOCK`    |
| `search`      | `Battery`      |
| `sortBy`      | `productName`  |
| `sortDir`     | `asc`          |
| `page`        | `1`            |
| `size`        | `20`           |

`stockStatus` values: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`

`sortBy` values: `productName`, `sku`, `locationName`, `quantityOnHand`, `stockStatus`

**Postman:**
```
GET http://localhost:8080/api/inventory?locationId=1&stockStatus=LOW_STOCK&page=1&size=20
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
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
      "updatedAt": "2026-07-30T16:45:00"
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

### GET /api/inventory/{productId}/{locationId}

Returns inventory for a specific product at a specific location.

**Postman:**
```
GET http://localhost:8080/api/inventory/10/1
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
```json
{
  "data": {
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
    "updatedAt": "2026-07-30T16:45:00"
  }
}
```

---

## Inventory Movements

### POST /api/inventory/movements/receive

Records a stock-receiving operation. Increases on-hand quantity. **Requires ADMIN or WAREHOUSE_OPERATOR role.**

**Postman:**
```
POST http://localhost:8080/api/inventory/movements/receive
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 10,
  "locationId": 1,
  "quantity": 120,
  "referenceId": "PO-2026-00841",
  "reason": "Scheduled delivery from supplier"
}
```

| Field         | Type    | Required | Constraints          |
|---------------|---------|----------|----------------------|
| `productId`   | integer | Yes      | Active product       |
| `locationId`  | integer | Yes      | Active location      |
| `quantity`    | integer | Yes      | > 0                  |
| `referenceId` | string  | No       | Max 100 chars        |
| `reason`      | string  | No       | Max 500 chars        |

**Example Response `201 Created`:**
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
    "performedAt": "2026-08-01T10:00:00"
  }
}
```

---

### POST /api/inventory/movements/transfer

Transfers stock between two locations. Creates a TRANSFER_OUT + TRANSFER_IN pair. **Requires ADMIN or WAREHOUSE_OPERATOR role.**

**Postman:**
```
POST http://localhost:8080/api/inventory/movements/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 10,
  "sourceLocationId": 1,
  "destinationLocationId": 4,
  "quantity": 30,
  "referenceId": "TRF-2026-00112",
  "reason": "Replenishment of Store 03"
}
```

| Field                   | Type    | Required | Constraints                                        |
|-------------------------|---------|----------|----------------------------------------------------|
| `productId`             | integer | Yes      | Active product                                     |
| `sourceLocationId`      | integer | Yes      | Active location                                    |
| `destinationLocationId` | integer | Yes      | Active location, must differ from `sourceLocationId` |
| `quantity`              | integer | Yes      | > 0, must not exceed stock at source               |
| `referenceId`           | string  | No       | Max 100 chars                                      |
| `reason`                | string  | No       | Max 500 chars                                      |

**Example Response `201 Created`:**
```json
{
  "data": {
    "transferId": "TRF-2026-00112",
    "outboundMovement": {
      "id": 902,
      "movementType": "TRANSFER_OUT",
      "location": { "id": 1, "name": "Warehouse A", "type": "WAREHOUSE" },
      "quantityDelta": -30,
      "quantityAfter": 210,
      "performedAt": "2026-08-01T10:05:00"
    },
    "inboundMovement": {
      "id": 903,
      "movementType": "TRANSFER_IN",
      "location": { "id": 4, "name": "Store 03", "type": "STORE" },
      "quantityDelta": 30,
      "quantityAfter": 48,
      "performedAt": "2026-08-01T10:05:00"
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

---

### POST /api/inventory/movements/adjust

Records a manual stock adjustment (positive or negative). **Requires ADMIN or WAREHOUSE_OPERATOR role.**

**Postman:**
```
POST http://localhost:8080/api/inventory/movements/adjust
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 10,
  "locationId": 4,
  "quantityDelta": -5,
  "reason": "Damage write-off — cracked packaging",
  "referenceId": "ADJ-2026-00034"
}
```

| Field           | Type    | Required | Constraints                              |
|-----------------|---------|----------|------------------------------------------|
| `productId`     | integer | Yes      | Active product                           |
| `locationId`    | integer | Yes      | Active location                          |
| `quantityDelta` | integer | Yes      | Non-zero; positive = add, negative = remove |
| `reason`        | string  | **Yes**  | Not blank, max 500 chars                 |
| `referenceId`   | string  | No       | Max 100 chars                            |

**Example Response `201 Created`:**
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
    "performedAt": "2026-08-01T10:10:00"
  }
}
```

---

### GET /api/inventory/movements

Returns paginated movement history.

**Query Parameters (all optional):**

| Parameter      | Example                  |
|----------------|--------------------------|
| `productId`    | `10`                     |
| `locationId`   | `1`                      |
| `movementType` | `RECEIVE`                |
| `performedBy`  | `5`                      |
| `dateFrom`     | `2026-07-01T00:00:00`    |
| `dateTo`       | `2026-08-01T23:59:59`    |
| `sortBy`       | `performedAt`            |
| `sortDir`      | `desc`                   |
| `page`         | `1`                      |
| `size`         | `20`                     |

`movementType` values: `RECEIVE`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT`

**Postman:**
```
GET http://localhost:8080/api/inventory/movements?productId=10&movementType=RECEIVE&sortDir=desc&page=1&size=20
Authorization: Bearer <token>
```

**With date range:**
```
GET http://localhost:8080/api/inventory/movements?dateFrom=2026-07-01T00:00:00&dateTo=2026-08-01T23:59:59
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
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
      "performedAt": "2026-08-01T10:00:00"
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

---

### GET /api/inventory/movements/{id}

Returns a single movement record by ID.

**Postman:**
```
GET http://localhost:8080/api/inventory/movements/901
Authorization: Bearer <token>
```

**Example Response `200 OK`:** Same shape as a single item from the list above, wrapped in `{ "data": { ... } }`.

---

## Dashboard

### GET /api/dashboard/summary

Returns high-level inventory metrics.

**Postman:**
```
GET http://localhost:8080/api/dashboard/summary
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
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
        "performedAt": "2026-08-01T10:10:00"
      }
    ]
  }
}
```

---

### GET /api/dashboard/stock-health

Returns stock health distribution broken down by location.

**Postman:**
```
GET http://localhost:8080/api/dashboard/stock-health
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
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

## Users

### GET /api/users

Returns a paginated list of users. **Requires ADMIN role.**

**Query Parameters (all optional):**

| Parameter | Example              |
|-----------|----------------------|
| `search`  | `john`               |
| `role`    | `WAREHOUSE_OPERATOR` |
| `active`  | `true`               |
| `sortBy`  | `username`           |
| `sortDir` | `asc`                |
| `page`    | `1`                  |
| `size`    | `20`                 |

`role` values: `ADMIN`, `WAREHOUSE_OPERATOR`, `STORE_OPERATOR`, `MANAGER`

**Postman:**
```
GET http://localhost:8080/api/users?role=WAREHOUSE_OPERATOR&active=true&page=1&size=20
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
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
      "createdAt": "2026-07-01T08:00:00",
      "updatedAt": "2026-07-01T08:00:00"
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

### GET /api/users/{id}

Returns a single user. **Requires ADMIN role.**

**Postman:**
```
GET http://localhost:8080/api/users/5
Authorization: Bearer <token>
```

**Example Response `200 OK`:**
```json
{
  "data": {
    "id": 5,
    "username": "jdoe",
    "fullName": "John Doe",
    "email": "j.doe@example.com",
    "role": "WAREHOUSE_OPERATOR",
    "active": true,
    "createdAt": "2026-07-01T08:00:00",
    "updatedAt": "2026-07-01T08:00:00"
  }
}
```

---

### POST /api/users

Creates a new user account. **Requires ADMIN role.**

**Postman:**
```
POST http://localhost:8080/api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "jdoe",
  "password": "TemporaryPass1!",
  "fullName": "John Doe",
  "email": "j.doe@example.com",
  "role": "WAREHOUSE_OPERATOR"
}
```

| Field      | Type   | Required | Constraints                                                          |
|------------|--------|----------|----------------------------------------------------------------------|
| `username` | string | Yes      | Not blank, max 50 chars, unique                                      |
| `password` | string | Yes      | Min 8 chars                                                          |
| `fullName` | string | Yes      | Not blank, max 100 chars                                             |
| `email`    | string | Yes      | Valid email, unique                                                  |
| `role`     | string | Yes      | `ADMIN`, `WAREHOUSE_OPERATOR`, `STORE_OPERATOR`, or `MANAGER`        |

**Example Response `201 Created`:** Same shape as GET by ID (no password in response).

---

### PUT /api/users/{id}

Updates a user's profile. **Requires ADMIN role.**

**Postman:**
```
PUT http://localhost:8080/api/users/5
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John M. Doe",
  "email": "jm.doe@example.com",
  "role": "MANAGER"
}
```

**Example Response `200 OK`:** Same shape as GET by ID.

---

### PATCH /api/users/{id}/deactivate

Deactivates a user account. **Requires ADMIN role.**

**Postman:**
```
PATCH http://localhost:8080/api/users/5/deactivate
Authorization: Bearer <token>
```

**Response `204 No Content`** (empty body)

---

### PATCH /api/users/{id}/activate

Reactivates a user account. **Requires ADMIN role.**

**Postman:**
```
PATCH http://localhost:8080/api/users/5/activate
Authorization: Bearer <token>
```

**Response `204 No Content`** (empty body)

---

## Standard Error Responses

All errors follow this shape:

```json
{
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed. See fieldErrors for details.",
  "timestamp": "2026-08-01T10:00:00Z",
  "fieldErrors": [
    { "field": "sku", "message": "SKU must not be blank." },
    { "field": "categoryId", "message": "Category ID is required." }
  ]
}
```

`fieldErrors` is omitted when not applicable.

### Error Code Reference

| HTTP Status | Error Code           | When                                                      |
|-------------|----------------------|-----------------------------------------------------------|
| `400`       | `VALIDATION_ERROR`   | Missing or invalid request fields                         |
| `400`       | `MALFORMED_REQUEST`  | JSON body is missing or cannot be parsed                  |
| `400`       | `INVALID_PARAMETER`  | Path or query parameter has the wrong type                |
| `401`       | `UNAUTHORIZED`       | No valid authentication token                             |
| `403`       | `ACCESS_DENIED`      | Authenticated but role does not permit the operation      |
| `404`       | `RESOURCE_NOT_FOUND` | Requested ID does not exist                               |
| `409`       | `DUPLICATE_RESOURCE` | Unique constraint violated (SKU, name, email, username)   |
| `422`       | `INSUFFICIENT_STOCK` | Transfer or adjustment would result in negative stock     |
| `422`       | `INACTIVE_RESOURCE`  | Operation on a deactivated product, location, or category |
| `422`       | `ALREADY_INACTIVE`   | Deactivation of an already-inactive resource              |
| `422`       | `INVALID_OPERATION`  | Same-location transfer, invalid date range, etc.          |
| `500`       | `INTERNAL_ERROR`     | Unexpected server failure                                 |

---

## Quick Reference — All Endpoints

| Method  | Endpoint                                    | Description                        | Min. Role            |
|---------|---------------------------------------------|------------------------------------|----------------------|
| GET     | `/api/categories`                           | List categories                    | Any authenticated    |
| GET     | `/api/categories/{id}`                      | Get category                       | Any authenticated    |
| POST    | `/api/categories`                           | Create category                    | ADMIN                |
| PUT     | `/api/categories/{id}`                      | Update category                    | ADMIN                |
| PATCH   | `/api/categories/{id}/deactivate`           | Deactivate category                | ADMIN                |
| PATCH   | `/api/categories/{id}/activate`             | Activate category                  | ADMIN                |
| GET     | `/api/products`                             | List products                      | Any authenticated    |
| GET     | `/api/products/{id}`                        | Get product with inventory         | Any authenticated    |
| POST    | `/api/products`                             | Create product                     | ADMIN                |
| PUT     | `/api/products/{id}`                        | Update product                     | ADMIN                |
| PATCH   | `/api/products/{id}/deactivate`             | Deactivate product                 | ADMIN                |
| PATCH   | `/api/products/{id}/activate`               | Activate product                   | ADMIN                |
| GET     | `/api/locations`                            | List locations                     | Any authenticated    |
| GET     | `/api/locations/{id}`                       | Get location                       | Any authenticated    |
| POST    | `/api/locations`                            | Create location                    | ADMIN                |
| PUT     | `/api/locations/{id}`                       | Update location                    | ADMIN                |
| PATCH   | `/api/locations/{id}/deactivate`            | Deactivate location                | ADMIN                |
| PATCH   | `/api/locations/{id}/activate`              | Activate location                  | ADMIN                |
| GET     | `/api/inventory`                            | List inventory (product-location)  | Any authenticated    |
| GET     | `/api/inventory/{productId}/{locationId}`   | Get specific inventory record      | Any authenticated    |
| POST    | `/api/inventory/movements/receive`          | Receive stock                      | ADMIN / WAREHOUSE_OP |
| POST    | `/api/inventory/movements/transfer`         | Transfer stock between locations   | ADMIN / WAREHOUSE_OP |
| POST    | `/api/inventory/movements/adjust`           | Adjust stock manually              | ADMIN / WAREHOUSE_OP |
| GET     | `/api/inventory/movements`                  | List movement history              | Any authenticated    |
| GET     | `/api/inventory/movements/{id}`             | Get movement record                | Any authenticated    |
| GET     | `/api/dashboard/summary`                    | Dashboard summary metrics          | Any authenticated    |
| GET     | `/api/dashboard/stock-health`               | Stock health by location           | Any authenticated    |
| GET     | `/api/users`                                | List users                         | ADMIN                |
| GET     | `/api/users/{id}`                           | Get user                           | ADMIN                |
| POST    | `/api/users`                                | Create user                        | ADMIN                |
| PUT     | `/api/users/{id}`                           | Update user                        | ADMIN                |
| PATCH   | `/api/users/{id}/deactivate`                | Deactivate user                    | ADMIN                |
| PATCH   | `/api/users/{id}/activate`                  | Activate user                      | ADMIN                |
