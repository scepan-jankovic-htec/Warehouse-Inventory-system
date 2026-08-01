package com.warehouse.inventory.domain;

/**
 * Package for core domain entities and value types.
 * 
 * This package defines the authoritative domain model for the application:
 * - All JPA entity classes
 * - Entity relationships and constraints
 * - Domain enums and value types
 * 
 * The domain layer has NO dependencies on any other application package.
 * This makes it the most stable part of the codebase.
 * 
 * Entities to be implemented:
 * - Category (product classifications)
 * - Product (catalog items with SKU, name, reorder threshold)
 * - Location (warehouse and store physical locations)
 * - Inventory (on-hand quantity per product-location pair)
 * - InventoryMovement (immutable record of every stock change)
 * - AppUser (user accounts with roles)
 * 
 * Entity design rules:
 * - All entities have a surrogate Long id as primary key
 * - All entities include createdAt and updatedAt timestamps
 * - Entities supporting soft deletion include isActive boolean
 * - InventoryMovement is write-once, never modified
 * - Entities are never exposed directly to the API
 */
class DomainLayerInfo {
}
