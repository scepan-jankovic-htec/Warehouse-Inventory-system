package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.Inventory;
import com.warehouse.inventory.domain.Location;
import com.warehouse.inventory.domain.Product;
import com.warehouse.inventory.domain.enums.LocationType;
import com.warehouse.inventory.domain.enums.StockStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class InventoryService {

    public PageResult<InventoryView> findAll(Collection<Inventory> inventories, InventoryQuery query) {
        Objects.requireNonNull(inventories, "Inventories must not be null.");
        Objects.requireNonNull(query, "Query must not be null.");

        int page = query.page() == null || query.page() < 1 ? 1 : query.page();
        int size = query.size() == null || query.size() < 1 ? 20 : Math.min(query.size(), 100);

        List<InventoryView> result = inventories.stream()
            .filter(inventory -> query.locationId() == null || hasLocationId(inventory, query.locationId()))
            .filter(inventory -> query.productId() == null || hasProductId(inventory, query.productId()))
            .filter(inventory -> query.categoryId() == null || hasCategoryId(inventory, query.categoryId()))
            .filter(inventory -> matchesSearch(inventory, query.search()))
            .map(this::toInventoryView)
            .filter(view -> query.stockStatus() == null || view.stockStatus() == query.stockStatus())
            .sorted(inventoryComparator(query.sortBy(), query.sortDir()))
            .toList();

        return PageResult.of(result, page, size);
    }

    public InventoryView findByProductAndLocation(Collection<Inventory> inventories, Integer productId, Integer locationId) {
        Inventory inventory = inventories.stream()
            .filter(candidate -> hasProductId(candidate, productId))
            .filter(candidate -> hasLocationId(candidate, locationId))
            .findFirst()
            .orElseThrow(() -> new NoSuchElementException(
                "Inventory not found for productId=" + productId + ", locationId=" + locationId));

        return toInventoryView(inventory);
    }

    public StockStatus deriveStockStatus(Inventory inventory) {
        Product product = inventory.getProduct();
        int reorderThreshold = product == null ? 0 : product.getReorderThreshold();
        int quantityOnHand = inventory.getQuantityOnHand();

        if (quantityOnHand == 0) {
            return StockStatus.OUT_OF_STOCK;
        }
        if (quantityOnHand <= reorderThreshold) {
            return StockStatus.LOW_STOCK;
        }
        return StockStatus.IN_STOCK;
    }

    private boolean hasLocationId(Inventory inventory, Integer locationId) {
        return inventory.getLocation() != null && Objects.equals(inventory.getLocation().getId(), locationId);
    }

    private boolean hasProductId(Inventory inventory, Integer productId) {
        return inventory.getProduct() != null && Objects.equals(inventory.getProduct().getId(), productId);
    }

    private boolean hasCategoryId(Inventory inventory, Integer categoryId) {
        return inventory.getProduct() != null
            && inventory.getProduct().getCategory() != null
            && Objects.equals(inventory.getProduct().getCategory().getId(), categoryId);
    }

    private boolean matchesSearch(Inventory inventory, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }

        Product product = inventory.getProduct();
        if (product == null) {
            return false;
        }

        String normalized = search.trim().toLowerCase(Locale.ROOT);
        return (product.getName() != null && product.getName().toLowerCase(Locale.ROOT).contains(normalized))
            || (product.getSku() != null && product.getSku().toLowerCase(Locale.ROOT).contains(normalized));
    }

    private Comparator<InventoryView> inventoryComparator(String sortBy, String sortDir) {
        Comparator<InventoryView> comparator = switch (sortBy == null ? "productName" : sortBy) {
            case "sku" -> Comparator.comparing(view -> nullSafe(view.product().sku()), String.CASE_INSENSITIVE_ORDER);
            case "locationName" -> Comparator.comparing(view -> nullSafe(view.location().name()), String.CASE_INSENSITIVE_ORDER);
            case "quantityOnHand" -> Comparator.comparingInt(InventoryView::quantityOnHand);
            case "stockStatus" -> Comparator.comparingInt(view -> stockStatusRank(view.stockStatus()));
            case "productName" -> Comparator.comparing(view -> nullSafe(view.product().name()), String.CASE_INSENSITIVE_ORDER);
            default -> Comparator.comparing(view -> nullSafe(view.product().name()), String.CASE_INSENSITIVE_ORDER);
        };

        return "desc".equalsIgnoreCase(sortDir) ? comparator.reversed() : comparator;
    }

    private int stockStatusRank(StockStatus stockStatus) {
        return switch (stockStatus) {
            case OUT_OF_STOCK -> 0;
            case LOW_STOCK -> 1;
            case IN_STOCK -> 2;
        };
    }

    private InventoryView toInventoryView(Inventory inventory) {
        Product product = inventory.getProduct();
        Location location = inventory.getLocation();

        return new InventoryView(
            inventory.getId(),
            new InventoryProductView(
                product == null ? null : product.getId(),
                product == null ? null : product.getSku(),
                product == null ? null : product.getName(),
                product == null ? null : product.getUnitOfMeasure(),
                product == null ? BigDecimal.ZERO : product.getPrice(),
                product == null ? 0 : product.getReorderThreshold()
            ),
            new InventoryLocationView(
                location == null ? null : location.getId(),
                location == null ? null : location.getName(),
                location == null ? null : location.getType()
            ),
            inventory.getQuantityOnHand(),
            deriveStockStatus(inventory),
            inventory.getUpdatedAt()
        );
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    public record InventoryProductView(
        Integer id,
        String sku,
        String name,
        String unitOfMeasure,
        BigDecimal price,
        int reorderThreshold
    ) {
    }

    public record InventoryLocationView(
        Integer id,
        String name,
        LocationType type
    ) {
    }

    public record InventoryView(
        Integer id,
        InventoryProductView product,
        InventoryLocationView location,
        int quantityOnHand,
        StockStatus stockStatus,
        LocalDateTime updatedAt
    ) {
    }
}
