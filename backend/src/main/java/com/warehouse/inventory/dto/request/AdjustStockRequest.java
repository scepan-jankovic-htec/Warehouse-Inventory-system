package com.warehouse.inventory.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdjustStockRequest(
    @NotNull(message = "Product ID is required.")
    Integer productId,

    @NotNull(message = "Location ID is required.")
    Integer locationId,

    @NotNull(message = "Quantity delta is required.")
    Integer quantityDelta,

    @NotBlank(message = "Reason must not be blank.")
    @Size(max = 500, message = "Reason must not exceed 500 characters.")
    String reason,

    @Size(max = 100, message = "Reference ID must not exceed 100 characters.")
    String referenceId
) {
    @AssertTrue(message = "Quantity delta must be non-zero.")
    public boolean isQuantityDeltaNonZero() {
        return quantityDelta != null && quantityDelta != 0;
    }
}
