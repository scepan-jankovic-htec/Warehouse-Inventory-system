package com.warehouse.inventory.service;

/**
 * Package for business logic and workflow orchestration.
 * 
 * Services in this package are responsible for:
 * - Enforcing all business rules defined in the functional requirements
 * - Validating inbound data against business context and state
 * - Coordinating multiple repository operations within transactions
 * - Raising typed business exceptions when rules are violated
 * - Mapping domain entities to response DTOs
 * 
 * Services have NO knowledge of HTTP. They consume DTOs and return
 * DTOs or domain objects.
 * 
 * Services to be implemented:
 * - CategoryService (category CRUD and deactivation)
 * - ProductService (product CRUD, SKU uniqueness, deactivation)
 * - LocationService (location CRUD and deactivation)
 * - InventoryService (read queries, stock state evaluation)
 * - MovementService (receive, transfer, adjustment workflows)
 * - DashboardService (metric aggregation)
 * - UserService (user CRUD, deactivation, password handling)
 */
class ServiceLayerInfo {
}
