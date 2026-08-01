package com.warehouse.inventory.service;

public record CategoryQuery(
    String search,
    Boolean active,
    String sortBy,
    String sortDir,
    Integer page,
    Integer size
) {
}
