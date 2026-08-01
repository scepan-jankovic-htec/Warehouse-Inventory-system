package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.enums.StockStatus;

public record InventoryQuery(
    Integer locationId,
    Integer productId,
    Integer categoryId,
    StockStatus stockStatus,
    String search,
    String sortBy,
    String sortDir,
    Integer page,
    Integer size
) {
}
