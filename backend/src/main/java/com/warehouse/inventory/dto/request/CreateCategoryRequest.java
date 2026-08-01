package com.warehouse.inventory.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
    @NotBlank(message = "Name must not be blank.")
    @Size(max = 100, message = "Name must not exceed 100 characters.")
    String name,

    @Size(max = 500, message = "Description must not exceed 500 characters.")
    String description
) {
}
