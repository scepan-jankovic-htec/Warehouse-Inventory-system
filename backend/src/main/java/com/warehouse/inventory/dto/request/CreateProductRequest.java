package com.warehouse.inventory.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateProductRequest(
    @NotBlank(message = "SKU must not be blank.")
    @Size(max = 50, message = "SKU must not exceed 50 characters.")
    @Pattern(regexp = "^(?!.*[a-z]).*$", message = "SKU must be uppercase.")
    String sku,

    @NotBlank(message = "Name must not be blank.")
    @Size(max = 200, message = "Name must not exceed 200 characters.")
    String name,

    @Size(max = 1000, message = "Description must not exceed 1000 characters.")
    String description,

    @NotNull(message = "Category ID is required.")
    Long categoryId,

    @NotBlank(message = "Unit of measure must not be blank.")
    @Size(max = 20, message = "Unit of measure must not exceed 20 characters.")
    String unitOfMeasure,

    @Min(value = 0, message = "Reorder threshold must be greater than or equal to 0.")
    Integer reorderThreshold
) {
}
