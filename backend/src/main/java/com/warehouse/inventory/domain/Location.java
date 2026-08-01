package com.warehouse.inventory.domain;

import com.warehouse.inventory.config.BooleanToIntegerConverter;
import com.warehouse.inventory.config.UtcIsoLocalDateTimeConverter;
import com.warehouse.inventory.domain.enums.LocationType;
import jakarta.persistence.*;
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
    name = "location",
    indexes = {
        @Index(name = "idx_location_name",      columnList = "name"),
        @Index(name = "idx_location_type",      columnList = "type"),
        @Index(name = "idx_location_is_active", columnList = "is_active")
    }
)
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private LocationType type;

    @Size(max = 500)
    @Column(name = "address")
    private String address;

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

    @OneToMany(mappedBy = "location", fetch = FetchType.LAZY)
    private List<Inventory> inventories = new ArrayList<>();

    @OneToMany(mappedBy = "location", fetch = FetchType.LAZY)
    private List<InventoryMovement> movements = new ArrayList<>();

    public Location() {}

    public Integer getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocationType getType() { return type; }
    public void setType(LocationType type) { this.type = type; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<Inventory> getInventories() { return inventories; }

    public List<InventoryMovement> getMovements() { return movements; }
}
