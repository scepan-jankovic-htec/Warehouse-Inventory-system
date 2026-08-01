package com.warehouse.inventory.domain;

import com.warehouse.inventory.config.UtcIsoLocalDateTimeConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "inventory",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_inventory_product_location",
                          columnNames = {"product_id", "location_id"})
    },
    indexes = {
        @Index(name = "idx_inventory_product_id",       columnList = "product_id"),
        @Index(name = "idx_inventory_location_id",      columnList = "location_id"),
        @Index(name = "idx_inventory_product_location", columnList = "product_id, location_id")
    }
)
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_inventory_product"))
    private Product product;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_inventory_location"))
    private Location location;

    @Min(0)
    @Column(name = "quantity_on_hand", nullable = false)
    private int quantityOnHand = 0;

    @CreationTimestamp
    @Convert(converter = UtcIsoLocalDateTimeConverter.class)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TEXT")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Convert(converter = UtcIsoLocalDateTimeConverter.class)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "updated_at", nullable = false, columnDefinition = "TEXT")
    private LocalDateTime updatedAt;

    public Inventory() {}

    public Integer getId() { return id; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }

    public int getQuantityOnHand() { return quantityOnHand; }
    public void setQuantityOnHand(int quantityOnHand) { this.quantityOnHand = quantityOnHand; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
