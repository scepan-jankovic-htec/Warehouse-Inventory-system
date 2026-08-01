package com.warehouse.inventory.domain;

import com.warehouse.inventory.config.BooleanToIntegerConverter;
import com.warehouse.inventory.config.UtcIsoLocalDateTimeConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "product",
    indexes = {
        @Index(name = "idx_product_sku",         columnList = "sku"),
        @Index(name = "idx_product_category_id", columnList = "category_id"),
        @Index(name = "idx_product_is_active",   columnList = "is_active"),
        @Index(name = "idx_product_name",        columnList = "name")
    }
)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    @Size(max = 100)
    @Column(name = "sku", nullable = false, unique = true)
    private String sku;

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 500)
    @Column(name = "description")
    private String description;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_product_category"))
    private Category category;

    @NotBlank
    @Size(max = 50)
    @Column(name = "unit_of_measure", nullable = false)
    private String unitOfMeasure;

    @Min(0)
    @Column(name = "reorder_threshold", nullable = false)
    private int reorderThreshold = 0;

    @Convert(converter = BooleanToIntegerConverter.class)
    @JdbcTypeCode(SqlTypes.INTEGER)
    @Column(name = "is_active", nullable = false, columnDefinition = "INTEGER")
    private boolean isActive = true;

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

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<Inventory> inventories = new ArrayList<>();

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<InventoryMovement> movements = new ArrayList<>();

    public Product() {}

    public Integer getId() { return id; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public String getUnitOfMeasure() { return unitOfMeasure; }
    public void setUnitOfMeasure(String unitOfMeasure) { this.unitOfMeasure = unitOfMeasure; }

    public int getReorderThreshold() { return reorderThreshold; }
    public void setReorderThreshold(int reorderThreshold) { this.reorderThreshold = reorderThreshold; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<Inventory> getInventories() { return inventories; }

    public List<InventoryMovement> getMovements() { return movements; }
}
