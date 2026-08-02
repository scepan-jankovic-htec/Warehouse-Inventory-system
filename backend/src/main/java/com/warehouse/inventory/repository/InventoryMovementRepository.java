package com.warehouse.inventory.repository;

import com.warehouse.inventory.domain.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Integer> {

    @Query("SELECT m FROM InventoryMovement m JOIN FETCH m.product JOIN FETCH m.location JOIN FETCH m.performedBy")
    List<InventoryMovement> findAllWithAssociations();
}
