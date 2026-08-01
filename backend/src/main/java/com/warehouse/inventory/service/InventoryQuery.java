package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.enums.StockStatus;

public record InventoryQuery(
    Long locationId,
    Long productId,
    Long categoryId,
    StockStatus stockStatus,
    String search,
    String sortBy,
    String sortDir,
    Integer page,
    Integer size
) {
}
