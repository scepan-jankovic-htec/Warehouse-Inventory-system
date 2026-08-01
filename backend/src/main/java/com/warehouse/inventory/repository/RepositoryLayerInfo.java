package com.warehouse.inventory.repository;

/**
 * Package for data access and persistence operations.
 * 
 * Repositories in this package are responsible for:
 * - CRUD operations for all domain entities
 * - Custom queries for filtering, sorting, and pagination
 * - Aggregation queries required by services
 * 
 * Repositories have NO knowledge of business rules. They execute queries
 * and return results. Business decisions belong to the service layer.
 * 
 * Repositories extend Spring Data JPA interfaces and are annotated with
 * @Repository for component scanning.
 * 
 * Repositories to be implemented:
 * - CategoryRepository (extends JpaRepository<Category, Long>)
 * - ProductRepository (extends JpaRepository<Product, Long>)
 * - LocationRepository (extends JpaRepository<Location, Long>)
 * - InventoryRepository (extends JpaRepository<Inventory, Long>)
 * - InventoryMovementRepository (extends JpaRepository<InventoryMovement, Long>)
 * - UserRepository (extends JpaRepository<AppUser, Long>)
 */
class RepositoryLayerInfo {
}
