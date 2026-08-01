package com.warehouse.inventory.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReceiveStockRequest(
    @NotNull(message = "Product ID is required.")
    Integer productId,

    @NotNull(message = "Location ID is required.")
    Integer locationId,

    @NotNull(message = "Quantity is required.")
    @Min(value = 1, message = "Quantity must be greater than 0.")
    Integer quantity,

    @Size(max = 100, message = "Reference ID must not exceed 100 characters.")
    String referenceId,

    @Size(max = 500, message = "Reason must not exceed 500 characters.")
    String reason
) {
}
