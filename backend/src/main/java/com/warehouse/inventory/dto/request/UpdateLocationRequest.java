package com.warehouse.inventory.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateLocationRequest(
    @NotBlank(message = "Name must not be blank.")
    @Size(max = 100, message = "Name must not exceed 100 characters.")
    String name,

    @NotBlank(message = "Type is required.")
    @Pattern(regexp = "WAREHOUSE|STORE", message = "Type must be WAREHOUSE or STORE.")
    String type,

    @Size(max = 300, message = "Address must not exceed 300 characters.")
    String address
) {
}
