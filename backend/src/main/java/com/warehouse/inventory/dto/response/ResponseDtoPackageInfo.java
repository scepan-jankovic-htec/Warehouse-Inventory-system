package com.warehouse.inventory.dto.response;

/**
 * Package for response Data Transfer Objects.
 * 
 * Response DTOs carry data returned to the client. They are constructed by the
 * mapper layer from domain entities.
 * 
 * Response DTOs to be implemented:
 * - CategoryResponse: Single category
 * - ProductResponse: Single product (basic)
 * - ProductDetailResponse: Product with inventory summary (GET /api/products/{id})
 * - LocationResponse: Single location
 * - InventoryResponse: Inventory record
 * - MovementResponse: Single inventory movement
 * - TransferResponse: Transfer operation result with counterpart IDs
 * - DashboardSummaryResponse: Summary metrics (GET /api/dashboard/summary)
 * - StockHealthResponse: Stock health analysis (GET /api/dashboard/stock-health)
 * - UserResponse: User account (never includes password_hash)
 * 
 * Standard collection/error wrappers to be implemented:
 * - PagedResponse<T>: Wraps paginated collections with pagination metadata
 * - ApiErrorResponse: Standard error response shape
 * - FieldErrorResponse: Nested field-level error information
 * 
 * Design rules:
 * - password_hash is never present in any response
 * - Nested summary objects are used instead of exposing full nested objects
 * - Pagination includes: page, size, totalElements, totalPages
 * - Error responses include: status, error, message, timestamp, optional fieldErrors
 */
class ResponseDtoPackageInfo {
}
