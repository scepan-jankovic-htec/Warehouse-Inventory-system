package com.warehouse.inventory.controller;

import com.warehouse.inventory.domain.Inventory;
import com.warehouse.inventory.dto.response.DataResponse;
import com.warehouse.inventory.repository.InventoryRepository;
import com.warehouse.inventory.service.InventoryQuery;
import com.warehouse.inventory.service.InventoryService;
import com.warehouse.inventory.service.InventoryService.InventoryView;
import com.warehouse.inventory.service.PageResult;
import com.warehouse.inventory.domain.enums.StockStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for {@code /inventory}.
 *
 * <p>HTTP mapping only — all business logic is delegated to {@link InventoryService}.</p>
 */
@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService inventoryService;
    private final InventoryRepository inventoryRepository;

    public InventoryController(InventoryService inventoryService, InventoryRepository inventoryRepository) {
        this.inventoryService = inventoryService;
        this.inventoryRepository = inventoryRepository;
    }

    // -------------------------------------------------------------------------
    // GET /inventory
    // Paginated inventory view — one row per product-location pair.
    // Supports filtering by locationId, productId, categoryId, stockStatus, search.
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<PageResult<InventoryView>> findAll(
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer productId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) StockStatus stockStatus,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        List<Inventory> all = inventoryRepository.findAll();
        PageResult<InventoryView> result = inventoryService.findAll(all,
                new InventoryQuery(locationId, productId, categoryId, stockStatus, search, sortBy, sortDir, page, size));
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // GET /inventory/{productId}/{locationId}
    // Current inventory for a specific product at a specific location.
    // 404 when no inventory record exists for the combination.
    // -------------------------------------------------------------------------

    @GetMapping("/{productId}/{locationId}")
    public ResponseEntity<DataResponse<InventoryView>> findByProductAndLocation(
            @PathVariable Integer productId,
            @PathVariable Integer locationId) {

        List<Inventory> all = inventoryRepository.findAll();
        InventoryView view = inventoryService.findByProductAndLocation(all, productId, locationId);
        return ResponseEntity.ok(DataResponse.of(view));
    }
}
