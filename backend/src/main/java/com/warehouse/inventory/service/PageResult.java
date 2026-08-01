package com.warehouse.inventory.service;

import java.util.List;

public record PageResult<T>(
    List<T> data,
    Pagination pagination
) {
    public record Pagination(
        int page,
        int size,
        long totalElements,
        int totalPages
    ) {
    }

    public static <T> PageResult<T> of(List<T> allData, int page, int size) {
        int fromIndex = Math.min((page - 1) * size, allData.size());
        int toIndex = Math.min(fromIndex + size, allData.size());
        int totalPages = allData.isEmpty() ? 0 : (int) Math.ceil((double) allData.size() / size);

        return new PageResult<>(
            allData.subList(fromIndex, toIndex),
            new Pagination(page, size, allData.size(), totalPages)
        );
    }
}
