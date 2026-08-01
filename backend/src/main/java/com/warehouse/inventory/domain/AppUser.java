package com.warehouse.inventory.domain;

import com.warehouse.inventory.config.BooleanToIntegerConverter;
import com.warehouse.inventory.config.UtcIsoLocalDateTimeConverter;
import com.warehouse.inventory.domain.enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
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
    name = "app_user",
    indexes = {
        @Index(name = "idx_user_username", columnList = "username"),
        @Index(name = "idx_user_email",    columnList = "email"),
        @Index(name = "idx_user_role",     columnList = "role")
    }
)
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    @Size(max = 100)
    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @NotBlank
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @NotBlank
    @Size(max = 200)
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @NotBlank
    @Email
    @Size(max = 200)
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role;

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

    @OneToMany(mappedBy = "performedBy", fetch = FetchType.LAZY)
    private List<InventoryMovement> movements = new ArrayList<>();

    public AppUser() {}

    public Integer getId() { return id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<InventoryMovement> getMovements() { return movements; }
}
