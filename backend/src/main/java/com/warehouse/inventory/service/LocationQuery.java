package com.warehouse.inventory.service;

public record LocationQuery(
    String search,
    String type,
    Boolean active,
    String sortBy,
    String sortDir,
    Integer page,
    Integer size
) {
}
