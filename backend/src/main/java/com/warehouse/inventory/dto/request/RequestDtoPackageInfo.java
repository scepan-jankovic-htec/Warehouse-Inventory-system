package com.warehouse.inventory.dto.request;

/**
 * Package for request Data Transfer Objects.
 * 
 * Request DTOs carry data submitted by the client. They are annotated with
 * Bean Validation constraints that are evaluated automatically when a controller
 * parameter is annotated with @Valid.
 * 
 * Request DTOs to be implemented:
 * - CreateCategoryRequest (POST /api/categories)
 * - UpdateCategoryRequest (PUT /api/categories/{id})
 * - CreateProductRequest (POST /api/products)
 * - UpdateProductRequest (PUT /api/products/{id})
 * - CreateLocationRequest (POST /api/locations)
 * - UpdateLocationRequest (PUT /api/locations/{id})
 * - ReceiveStockRequest (POST /api/inventory/movements/receive)
 * - TransferStockRequest (POST /api/inventory/movements/transfer)
 * - AdjustStockRequest (POST /api/inventory/movements/adjust)
 * - CreateUserRequest (POST /api/users)
 * - UpdateUserRequest (PUT /api/users/{id})
 * 
 * Validation constraints used:
 * - @NotBlank: Required string fields
 * - @NotNull: Required non-string fields
 * - @Size(max = N): String fields with maximum length
 * - @Min(value = 0): Non-negative quantities
 * - @Min(value = 1): Positive quantities
 * - @NotZero: Custom constraint for adjustment quantities
 * - @Email: Email validation
 * - @Pattern: Enum-level validation for role, type, movementType
 */
class RequestDtoPackageInfo {
}
