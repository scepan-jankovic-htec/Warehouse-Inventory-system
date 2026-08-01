package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.Inventory;
import com.warehouse.inventory.domain.InventoryMovement;
import com.warehouse.inventory.domain.Location;
import com.warehouse.inventory.domain.Product;
import com.warehouse.inventory.domain.enums.LocationType;
import com.warehouse.inventory.domain.enums.MovementType;
import com.warehouse.inventory.domain.enums.StockStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final InventoryService inventoryService;

    public DashboardService(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    public DashboardSummary getSummary(
        Collection<Product> products,
        Collection<Location> locations,
        Collection<Inventory> inventories,
        Collection<InventoryMovement> movements
    ) {
        long totalActiveProducts = products.stream().filter(Product::isActive).count();
        long totalActiveLocations = locations.stream().filter(Location::isActive).count();

        long lowStockCount = inventories.stream()
            .filter(this::isOperationalInventory)
            .filter(inventory -> inventoryService.deriveStockStatus(inventory) == StockStatus.LOW_STOCK)
            .count();

        long outOfStockCount = inventories.stream()
            .filter(this::isOperationalInventory)
            .filter(inventory -> inventoryService.deriveStockStatus(inventory) == StockStatus.OUT_OF_STOCK)
            .count();

        List<RecentMovementView> recentMovements = movements.stream()
            .sorted(Comparator.comparing(this::movementTimestamp).reversed())
            .limit(10)
            .map(this::toRecentMovementView)
            .toList();

        return new DashboardSummary(totalActiveProducts, totalActiveLocations, lowStockCount, outOfStockCount, recentMovements);
    }

    public List<StockHealthView> getStockHealth(Collection<Location> locations, Collection<Inventory> inventories) {
        return locations.stream()
            .filter(Location::isActive)
            .map(location -> toStockHealthView(location, inventories))
            .sorted(Comparator.comparing(view -> view.location().name(), String.CASE_INSENSITIVE_ORDER))
            .toList();
    }

    private boolean isOperationalInventory(Inventory inventory) {
        return inventory.getProduct() != null
            && inventory.getProduct().isActive()
            && inventory.getLocation() != null
            && inventory.getLocation().isActive();
    }

    private StockHealthView toStockHealthView(Location location, Collection<Inventory> inventories) {
        long inStockCount = inventories.stream()
            .filter(inventory -> inventory.getLocation() != null)
            .filter(inventory -> Objects.equals(inventory.getLocation().getId(), location.getId()))
            .filter(this::isOperationalInventory)
            .filter(inventory -> inventoryService.deriveStockStatus(inventory) == StockStatus.IN_STOCK)
            .count();

        long lowStockCount = inventories.stream()
            .filter(inventory -> inventory.getLocation() != null)
            .filter(inventory -> Objects.equals(inventory.getLocation().getId(), location.getId()))
            .filter(this::isOperationalInventory)
            .filter(inventory -> inventoryService.deriveStockStatus(inventory) == StockStatus.LOW_STOCK)
            .count();

        long outOfStockCount = inventories.stream()
            .filter(inventory -> inventory.getLocation() != null)
            .filter(inventory -> Objects.equals(inventory.getLocation().getId(), location.getId()))
            .filter(this::isOperationalInventory)
            .filter(inventory -> inventoryService.deriveStockStatus(inventory) == StockStatus.OUT_OF_STOCK)
            .count();

        return new StockHealthView(
            new DashboardLocationView(location.getId(), location.getName(), location.getType()),
            inStockCount,
            lowStockCount,
            outOfStockCount
        );
    }

    private RecentMovementView toRecentMovementView(InventoryMovement movement) {
        return new RecentMovementView(
            movement.getId(),
            movement.getMovementType(),
            movement.getProduct() == null ? null : movement.getProduct().getName(),
            movement.getLocation() == null ? null : movement.getLocation().getName(),
            movement.getQuantityDelta(),
            movementTimestamp(movement)
        );
    }

    private LocalDateTime movementTimestamp(InventoryMovement movement) {
        return movement.getPerformedAt() == null ? LocalDateTime.MIN : movement.getPerformedAt();
    }

    public record DashboardSummary(
        long totalActiveProducts,
        long totalActiveLocations,
        long lowStockCount,
        long outOfStockCount,
        List<RecentMovementView> recentMovements
    ) {
    }

    public record RecentMovementView(
        Long id,
        MovementType movementType,
        String productName,
        String locationName,
        int quantityDelta,
        LocalDateTime performedAt
    ) {
    }

    public record DashboardLocationView(Long id, String name, LocationType type) {
    }

    public record StockHealthView(
        DashboardLocationView location,
        long inStockCount,
        long lowStockCount,
        long outOfStockCount
    ) {
    }
}
