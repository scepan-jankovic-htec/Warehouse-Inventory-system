package com.warehouse.inventory.service;

public record ProductQuery(
    String search,
    Integer categoryId,
    Boolean active,
    String sortBy,
    String sortDir,
    Integer page,
    Integer size
) {
}
