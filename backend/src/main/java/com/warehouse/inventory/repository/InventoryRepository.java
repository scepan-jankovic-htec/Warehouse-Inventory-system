package com.warehouse.inventory.repository;

import com.warehouse.inventory.domain.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {

    @Query("SELECT i FROM Inventory i JOIN FETCH i.product JOIN FETCH i.location WHERE i.product.id = :productId AND i.location.id = :locationId")
    Optional<Inventory> findByProductIdAndLocationId(@Param("productId") Integer productId,
                                                     @Param("locationId") Integer locationId);
}
