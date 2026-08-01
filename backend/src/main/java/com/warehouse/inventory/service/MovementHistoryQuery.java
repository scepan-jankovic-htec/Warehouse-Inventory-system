package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.enums.MovementType;

import java.time.LocalDateTime;

public record MovementHistoryQuery(
    Integer productId,
    Integer locationId,
    MovementType movementType,
    Integer performedBy,
    LocalDateTime dateFrom,
    LocalDateTime dateTo,
    String sortBy,
    String sortDir,
    Integer page,
    Integer size
) {
}
