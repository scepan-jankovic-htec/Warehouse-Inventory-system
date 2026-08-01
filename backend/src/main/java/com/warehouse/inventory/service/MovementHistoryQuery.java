package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.enums.MovementType;

import java.time.LocalDateTime;

public record MovementHistoryQuery(
    Long productId,
    Long locationId,
    MovementType movementType,
    Long performedBy,
    LocalDateTime dateFrom,
    LocalDateTime dateTo,
    String sortBy,
    String sortDir,
    Integer page,
    Integer size
) {
}
