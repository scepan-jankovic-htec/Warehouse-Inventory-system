package com.warehouse.inventory.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank(message = "Username must not be blank.")
    @Size(max = 50, message = "Username must not exceed 50 characters.")
    String username,

    @NotBlank(message = "Password must not be blank.")
    @Size(min = 8, message = "Password must be at least 8 characters long.")
    String password,

    @NotBlank(message = "Full name must not be blank.")
    @Size(max = 100, message = "Full name must not exceed 100 characters.")
    String fullName,

    @NotBlank(message = "Email must not be blank.")
    @Email(message = "Email must be a valid email address.")
    String email,

    @NotBlank(message = "Role is required.")
    @Pattern(regexp = "ADMIN|WAREHOUSE_OPERATOR|STORE_OPERATOR|MANAGER", message = "Role must be ADMIN, WAREHOUSE_OPERATOR, STORE_OPERATOR, or MANAGER.")
    String role
) {
}
