package com.warehouse.inventory.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TransferStockRequest(
    @NotNull(message = "Product ID is required.")
    Long productId,

    @NotNull(message = "Source location ID is required.")
    Long sourceLocationId,

    @NotNull(message = "Destination location ID is required.")
    Long destinationLocationId,

    @NotNull(message = "Quantity is required.")
    @Min(value = 1, message = "Quantity must be greater than 0.")
    Integer quantity,

    @Size(max = 100, message = "Reference ID must not exceed 100 characters.")
    String referenceId,

    @Size(max = 500, message = "Reason must not exceed 500 characters.")
    String reason
) {
}
