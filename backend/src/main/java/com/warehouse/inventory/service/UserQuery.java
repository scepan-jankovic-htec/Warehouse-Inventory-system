package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.enums.UserRole;

public record UserQuery(
    String search,
    UserRole role,
    Boolean active,
    String sortBy,
    String sortDir,
    Integer page,
    Integer size
) {
}
