package com.warehouse.inventory.domain;

import com.warehouse.inventory.config.BooleanToIntegerConverter;
import com.warehouse.inventory.config.UtcIsoLocalDateTimeConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
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
    name = "category",
    indexes = {
        @Index(name = "idx_category_name",      columnList = "name"),
        @Index(name = "idx_category_is_active",  columnList = "is_active")
    }
)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Size(max = 500)
    @Column(name = "description")
    private String description;

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

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<Product> products = new ArrayList<>();

    public Category() {}

    public Integer getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<Product> getProducts() { return products; }
}
