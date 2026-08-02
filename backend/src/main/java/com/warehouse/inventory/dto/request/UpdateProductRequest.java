package com.warehouse.inventory.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateProductRequest(
    @NotBlank(message = "Name must not be blank.")
    @Size(max = 200, message = "Name must not exceed 200 characters.")
    String name,

    @Size(max = 1000, message = "Description must not exceed 1000 characters.")
    String description,

    @NotNull(message = "Category ID is required.")
    Integer categoryId,

    @NotBlank(message = "Unit of measure must not be blank.")
    @Size(max = 20, message = "Unit of measure must not exceed 20 characters.")
    String unitOfMeasure,

    @NotNull(message = "Price is required.")
    @DecimalMin(value = "0.00", message = "Price must be greater than or equal to 0.")
    BigDecimal price,

    @Min(value = 0, message = "Reorder threshold must be greater than or equal to 0.")
    Integer reorderThreshold
) {
}
