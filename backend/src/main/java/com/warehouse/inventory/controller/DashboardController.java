package com.warehouse.inventory.controller;

import com.warehouse.inventory.domain.Inventory;
import com.warehouse.inventory.domain.InventoryMovement;
import com.warehouse.inventory.domain.Location;
import com.warehouse.inventory.domain.Product;
import com.warehouse.inventory.dto.response.DataResponse;
import com.warehouse.inventory.repository.InventoryMovementRepository;
import com.warehouse.inventory.repository.InventoryRepository;
import com.warehouse.inventory.repository.LocationRepository;
import com.warehouse.inventory.repository.ProductRepository;
import com.warehouse.inventory.service.DashboardService;
import com.warehouse.inventory.service.DashboardService.DashboardSummary;
import com.warehouse.inventory.service.DashboardService.StockHealthView;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for {@code /dashboard}.
 *
 * <p>HTTP mapping only — all aggregation logic is delegated to {@link DashboardService}.</p>
 */
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;

    public DashboardController(
            DashboardService dashboardService,
            ProductRepository productRepository,
            LocationRepository locationRepository,
            InventoryRepository inventoryRepository,
            InventoryMovementRepository movementRepository) {
        this.dashboardService = dashboardService;
        this.productRepository = productRepository;
        this.locationRepository = locationRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
    }

    // -------------------------------------------------------------------------
    // GET /dashboard/summary
    // High-level inventory metrics: counts and 10 most recent movements.
    // -------------------------------------------------------------------------

    @GetMapping("/summary")
    public ResponseEntity<DataResponse<DashboardSummary>> getSummary() {
        List<Product> products = productRepository.findAll();
        List<Location> locations = locationRepository.findAll();
        List<Inventory> inventories = inventoryRepository.findAll();
        List<InventoryMovement> movements = movementRepository.findAll();

        DashboardSummary summary = dashboardService.getSummary(products, locations, inventories, movements);
        return ResponseEntity.ok(DataResponse.of(summary));
    }

    // -------------------------------------------------------------------------
    // GET /dashboard/stock-health
    // Stock health distribution (IN_STOCK / LOW_STOCK / OUT_OF_STOCK) per location.
    // -------------------------------------------------------------------------

    @GetMapping("/stock-health")
    public ResponseEntity<DataResponse<List<StockHealthView>>> getStockHealth() {
        List<Location> locations = locationRepository.findAll();
        List<Inventory> inventories = inventoryRepository.findAll();

        List<StockHealthView> health = dashboardService.getStockHealth(locations, inventories);
        return ResponseEntity.ok(DataResponse.of(health));
    }
}
