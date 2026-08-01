package com.warehouse.inventory.domain;

import com.warehouse.inventory.config.UtcIsoLocalDateTimeConverter;
import com.warehouse.inventory.domain.enums.MovementType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "inventory_movement",
    indexes = {
        @Index(name = "idx_movement_product_id",        columnList = "product_id"),
        @Index(name = "idx_movement_location_id",       columnList = "location_id"),
        @Index(name = "idx_movement_performed_at",      columnList = "performed_at"),
        @Index(name = "idx_movement_type",              columnList = "movement_type"),
        @Index(name = "idx_movement_performed_by",      columnList = "performed_by"),
        @Index(name = "idx_movement_product_location_at",
               columnList = "product_id, location_id, performed_at")
    }
)
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_movement_product"))
    private Product product;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_movement_location"))
    private Location location;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false)
    private MovementType movementType;

    // Must be non-zero; positive = stock increase, negative = stock decrease.
    // Zero enforcement is done at the service layer (Bean Validation @NotZero on DTO).
    @Column(name = "quantity_delta", nullable = false)
    private int quantityDelta;

    @Size(max = 100)
    @Column(name = "reference_id")
    private String referenceId;

    // Required for ADJUSTMENT type; enforced at the service layer.
    @Size(max = 500)
    @Column(name = "reason")
    private String reason;

    // Self-referential FK linking the two legs of a TRANSFER.
    // TRANSFER_OUT references its paired TRANSFER_IN and vice-versa.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_counterpart_id",
                foreignKey = @ForeignKey(name = "fk_movement_counterpart"))
    private InventoryMovement transferCounterpart;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "performed_by", nullable = false,
                foreignKey = @ForeignKey(name = "fk_movement_user"))
    private AppUser performedBy;

    @CreationTimestamp
    @Convert(converter = UtcIsoLocalDateTimeConverter.class)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "performed_at", nullable = false, updatable = false, columnDefinition = "TEXT")
    private LocalDateTime performedAt;

    public InventoryMovement() {}

    public Integer getId() { return id; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }

    public MovementType getMovementType() { return movementType; }
    public void setMovementType(MovementType movementType) { this.movementType = movementType; }

    public int getQuantityDelta() { return quantityDelta; }
    public void setQuantityDelta(int quantityDelta) { this.quantityDelta = quantityDelta; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public InventoryMovement getTransferCounterpart() { return transferCounterpart; }
    public void setTransferCounterpart(InventoryMovement transferCounterpart) {
        this.transferCounterpart = transferCounterpart;
    }

    public AppUser getPerformedBy() { return performedBy; }
    public void setPerformedBy(AppUser performedBy) { this.performedBy = performedBy; }

    public LocalDateTime getPerformedAt() { return performedAt; }
}
