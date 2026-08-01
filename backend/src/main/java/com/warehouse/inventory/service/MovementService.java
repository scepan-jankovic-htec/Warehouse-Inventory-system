package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.AppUser;
import com.warehouse.inventory.domain.Inventory;
import com.warehouse.inventory.domain.InventoryMovement;
import com.warehouse.inventory.domain.Location;
import com.warehouse.inventory.domain.Product;
import com.warehouse.inventory.domain.enums.LocationType;
import com.warehouse.inventory.domain.enums.MovementType;
import com.warehouse.inventory.dto.request.AdjustStockRequest;
import com.warehouse.inventory.dto.request.ReceiveStockRequest;
import com.warehouse.inventory.dto.request.TransferStockRequest;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class MovementService extends ServiceValidationSupport {

    private final ProductService productService;
    private final LocationService locationService;

    public MovementService(Validator validator, ProductService productService, LocationService locationService) {
        super(validator);
        this.productService = productService;
        this.locationService = locationService;
    }

    @Transactional
    public MovementResult receive(
        Collection<Product> products,
        Collection<Location> locations,
        Collection<Inventory> inventories,
        AppUser actor,
        ReceiveStockRequest request
    ) {
        validate(request);
        AppUser activeActor = requireActiveActor(actor);
        Product product = productService.resolveActiveProduct(products, request.productId());
        Location location = locationService.resolveActiveLocation(locations, request.locationId());
        Inventory inventory = findOrCreateInventory(inventories, product, location);

        int quantityAfter = inventory.getQuantityOnHand() + request.quantity();
        inventory.setQuantityOnHand(quantityAfter);

        InventoryMovement movement = new InventoryMovement();
        movement.setProduct(product);
        movement.setLocation(location);
        movement.setMovementType(MovementType.RECEIVE);
        movement.setQuantityDelta(request.quantity());
        movement.setReferenceId(normalizeNullableText(request.referenceId()));
        movement.setReason(normalizeNullableText(request.reason()));
        movement.setPerformedBy(activeActor);

        return toMovementResult(movement, quantityAfter, LocalDateTime.now());
    }

    @Transactional
    public TransferResult transfer(
        Collection<Product> products,
        Collection<Location> locations,
        Collection<Inventory> inventories,
        AppUser actor,
        TransferStockRequest request
    ) {
        validate(request);
        AppUser activeActor = requireActiveActor(actor);
        Product product = productService.resolveActiveProduct(products, request.productId());
        Location sourceLocation = locationService.resolveActiveLocation(locations, request.sourceLocationId());
        Location destinationLocation = locationService.resolveActiveLocation(locations, request.destinationLocationId());

        if (Objects.equals(sourceLocation.getId(), destinationLocation.getId())) {
            throw new IllegalArgumentException("Source and destination locations must be different.");
        }

        Inventory sourceInventory = findExistingInventory(inventories, product.getId(), sourceLocation.getId())
            .orElseThrow(() -> new IllegalStateException("Insufficient stock at source location."));
        if (sourceInventory.getQuantityOnHand() < request.quantity()) {
            throw new IllegalStateException("Insufficient stock at source location.");
        }

        Inventory destinationInventory = findOrCreateInventory(inventories, product, destinationLocation);
        sourceInventory.setQuantityOnHand(sourceInventory.getQuantityOnHand() - request.quantity());
        destinationInventory.setQuantityOnHand(destinationInventory.getQuantityOnHand() + request.quantity());

        String transferId = request.referenceId() == null || request.referenceId().isBlank()
            ? "TRF-" + UUID.randomUUID()
            : request.referenceId().trim();
        LocalDateTime performedAt = LocalDateTime.now();

        InventoryMovement outboundMovement = new InventoryMovement();
        outboundMovement.setProduct(product);
        outboundMovement.setLocation(sourceLocation);
        outboundMovement.setMovementType(MovementType.TRANSFER_OUT);
        outboundMovement.setQuantityDelta(-request.quantity());
        outboundMovement.setReferenceId(transferId);
        outboundMovement.setReason(normalizeNullableText(request.reason()));
        outboundMovement.setPerformedBy(activeActor);

        InventoryMovement inboundMovement = new InventoryMovement();
        inboundMovement.setProduct(product);
        inboundMovement.setLocation(destinationLocation);
        inboundMovement.setMovementType(MovementType.TRANSFER_IN);
        inboundMovement.setQuantityDelta(request.quantity());
        inboundMovement.setReferenceId(transferId);
        inboundMovement.setReason(normalizeNullableText(request.reason()));
        inboundMovement.setPerformedBy(activeActor);

        outboundMovement.setTransferCounterpart(inboundMovement);
        inboundMovement.setTransferCounterpart(outboundMovement);

        return new TransferResult(
            transferId,
            toMovementResult(outboundMovement, sourceInventory.getQuantityOnHand(), performedAt),
            toMovementResult(inboundMovement, destinationInventory.getQuantityOnHand(), performedAt),
            new ProductSnapshot(product.getId(), product.getSku(), product.getName()),
            new ActorSnapshot(activeActor.getId(), activeActor.getUsername(), activeActor.getFullName())
        );
    }

    @Transactional
    public MovementResult adjust(
        Collection<Product> products,
        Collection<Location> locations,
        Collection<Inventory> inventories,
        AppUser actor,
        AdjustStockRequest request
    ) {
        validate(request);
        if (request.quantityDelta() == 0) {
            throw new IllegalArgumentException("Quantity delta must be non-zero.");
        }

        AppUser activeActor = requireActiveActor(actor);
        Product product = productService.resolveActiveProduct(products, request.productId());
        Location location = locationService.resolveActiveLocation(locations, request.locationId());
        Inventory inventory = findOrCreateInventory(inventories, product, location);

        int quantityAfter = inventory.getQuantityOnHand() + request.quantityDelta();
        if (quantityAfter < 0) {
            throw new IllegalStateException("Stock cannot become negative.");
        }

        inventory.setQuantityOnHand(quantityAfter);

        InventoryMovement movement = new InventoryMovement();
        movement.setProduct(product);
        movement.setLocation(location);
        movement.setMovementType(MovementType.ADJUSTMENT);
        movement.setQuantityDelta(request.quantityDelta());
        movement.setReason(request.reason().trim());
        movement.setReferenceId(normalizeNullableText(request.referenceId()));
        movement.setPerformedBy(activeActor);

        return toMovementResult(movement, quantityAfter, LocalDateTime.now());
    }

    public PageResult<HistoryView> findAll(Collection<InventoryMovement> movements, MovementHistoryQuery query) {
        Objects.requireNonNull(movements, "Movements must not be null.");
        Objects.requireNonNull(query, "Query must not be null.");

        if (query.dateFrom() != null && query.dateTo() != null && query.dateFrom().isAfter(query.dateTo())) {
            throw new IllegalArgumentException("dateFrom must not be after dateTo.");
        }

        int page = normalizePage(query.page());
        int size = normalizeSize(query.size());

        List<HistoryView> result = movements.stream()
            .filter(movement -> query.productId() == null || hasProductId(movement, query.productId()))
            .filter(movement -> query.locationId() == null || hasLocationId(movement, query.locationId()))
            .filter(movement -> query.movementType() == null || movement.getMovementType() == query.movementType())
            .filter(movement -> query.performedBy() == null || hasPerformedBy(movement, query.performedBy()))
            .filter(movement -> query.dateFrom() == null || !timestampOf(movement).isBefore(query.dateFrom()))
            .filter(movement -> query.dateTo() == null || !timestampOf(movement).isAfter(query.dateTo()))
            .map(this::toHistoryView)
            .sorted(historyComparator(query.sortBy(), query.sortDir()))
            .toList();

        return PageResult.of(result, page, size);
    }

    public HistoryView findById(Collection<InventoryMovement> movements, Integer movementId) {
        InventoryMovement movement = movements.stream()
            .filter(candidate -> Objects.equals(candidate.getId(), movementId))
            .findFirst()
            .orElseThrow(() -> new NoSuchElementException("Movement not found for id=" + movementId));

        return toHistoryView(movement);
    }

    private AppUser requireActiveActor(AppUser actor) {
        Objects.requireNonNull(actor, "Actor must not be null.");
        if (!actor.isActive()) {
            throw new IllegalStateException("Inactive users cannot perform inventory operations.");
        }
        return actor;
    }

    private java.util.Optional<Inventory> findExistingInventory(Collection<Inventory> inventories, Integer productId, Integer locationId) {
        return inventories.stream()
            .filter(inventory -> inventory.getProduct() != null)
            .filter(inventory -> inventory.getLocation() != null)
            .filter(inventory -> Objects.equals(inventory.getProduct().getId(), productId))
            .filter(inventory -> Objects.equals(inventory.getLocation().getId(), locationId))
            .findFirst();
    }

    private Inventory findOrCreateInventory(Collection<Inventory> inventories, Product product, Location location) {
        return findExistingInventory(inventories, product.getId(), location.getId())
            .orElseGet(() -> {
                Inventory inventory = new Inventory();
                inventory.setProduct(product);
                inventory.setLocation(location);
                inventory.setQuantityOnHand(0);
                return inventory;
            });
    }

    private boolean hasProductId(InventoryMovement movement, Integer productId) {
        return movement.getProduct() != null && Objects.equals(movement.getProduct().getId(), productId);
    }

    private boolean hasLocationId(InventoryMovement movement, Integer locationId) {
        return movement.getLocation() != null && Objects.equals(movement.getLocation().getId(), locationId);
    }

    private boolean hasPerformedBy(InventoryMovement movement, Integer performedBy) {
        return movement.getPerformedBy() != null && Objects.equals(movement.getPerformedBy().getId(), performedBy);
    }

    private Comparator<HistoryView> historyComparator(String sortBy, String sortDir) {
        Comparator<HistoryView> comparator = switch (sortBy == null ? "performedAt" : sortBy) {
            case "quantityDelta" -> Comparator.comparingInt(HistoryView::quantityDelta);
            case "performedAt" -> Comparator.comparing(HistoryView::performedAt);
            default -> Comparator.comparing(HistoryView::performedAt);
        };

        boolean descendingDefault = sortDir == null && (sortBy == null || "performedAt".equals(sortBy));
        if (descendingDefault || "desc".equalsIgnoreCase(sortDir)) {
            return comparator.reversed();
        }
        return comparator;
    }

    private MovementResult toMovementResult(InventoryMovement movement, int quantityAfter, LocalDateTime performedAt) {
        return new MovementResult(
            movement.getId(),
            movement.getMovementType(),
            new ProductSnapshot(
                movement.getProduct() == null ? null : movement.getProduct().getId(),
                movement.getProduct() == null ? null : movement.getProduct().getSku(),
                movement.getProduct() == null ? null : movement.getProduct().getName()
            ),
            new LocationSnapshot(
                movement.getLocation() == null ? null : movement.getLocation().getId(),
                movement.getLocation() == null ? null : movement.getLocation().getName(),
                movement.getLocation() == null ? null : movement.getLocation().getType()
            ),
            movement.getQuantityDelta(),
            quantityAfter,
            movement.getReferenceId(),
            movement.getReason(),
            new ActorSnapshot(
                movement.getPerformedBy() == null ? null : movement.getPerformedBy().getId(),
                movement.getPerformedBy() == null ? null : movement.getPerformedBy().getUsername(),
                movement.getPerformedBy() == null ? null : movement.getPerformedBy().getFullName()
            ),
            performedAt
        );
    }

    private HistoryView toHistoryView(InventoryMovement movement) {
        return new HistoryView(
            movement.getId(),
            movement.getMovementType(),
            new ProductSnapshot(
                movement.getProduct() == null ? null : movement.getProduct().getId(),
                movement.getProduct() == null ? null : movement.getProduct().getSku(),
                movement.getProduct() == null ? null : movement.getProduct().getName()
            ),
            new LocationSnapshot(
                movement.getLocation() == null ? null : movement.getLocation().getId(),
                movement.getLocation() == null ? null : movement.getLocation().getName(),
                movement.getLocation() == null ? null : movement.getLocation().getType()
            ),
            movement.getQuantityDelta(),
            movement.getReferenceId(),
            movement.getReason(),
            movement.getTransferCounterpart() == null ? null : movement.getTransferCounterpart().getId(),
            new ActorSnapshot(
                movement.getPerformedBy() == null ? null : movement.getPerformedBy().getId(),
                movement.getPerformedBy() == null ? null : movement.getPerformedBy().getUsername(),
                movement.getPerformedBy() == null ? null : movement.getPerformedBy().getFullName()
            ),
            timestampOf(movement)
        );
    }

    private LocalDateTime timestampOf(InventoryMovement movement) {
        return movement.getPerformedAt() == null ? LocalDateTime.MIN : movement.getPerformedAt();
    }

    private String normalizeNullableText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record ProductSnapshot(Integer id, String sku, String name) {
    }

    public record LocationSnapshot(Integer id, String name, LocationType type) {
    }

    public record ActorSnapshot(Integer id, String username, String fullName) {
    }

    public record MovementResult(
        Integer id,
        MovementType movementType,
        ProductSnapshot product,
        LocationSnapshot location,
        int quantityDelta,
        int quantityAfter,
        String referenceId,
        String reason,
        ActorSnapshot performedBy,
        LocalDateTime performedAt
    ) {
    }

    public record TransferResult(
        String transferId,
        MovementResult outboundMovement,
        MovementResult inboundMovement,
        ProductSnapshot product,
        ActorSnapshot performedBy
    ) {
    }

    public record HistoryView(
        Integer id,
        MovementType movementType,
        ProductSnapshot product,
        LocationSnapshot location,
        int quantityDelta,
        String referenceId,
        String reason,
        Integer transferCounterpartId,
        ActorSnapshot performedBy,
        LocalDateTime performedAt
    ) {
    }
}
