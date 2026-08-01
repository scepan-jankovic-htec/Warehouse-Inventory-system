package com.warehouse.inventory.mapper;

/**
 * Package for domain to DTO conversion.
 * 
 * Mappers are stateless utility classes that convert domain entities to
 * response DTOs and request DTOs to domain entities. They perform field-by-field
 * conversion with no business logic. Every conversion is explicit and auditable.
 * 
 * Keeping mapping logic separate from the service layer keeps services focused
 * on business decisions. Keeping it out of controllers keeps controllers focused
 * on HTTP concerns. Mappers are the only place where entity structure and DTO
 * structure are compared, making contract changes easy to locate and audit.
 * 
 * Mappers to be implemented:
 * - CategoryMapper: Category <-> CategoryResponse, CreateCategoryRequest -> Category
 * - ProductMapper: Product <-> ProductResponse / ProductDetailResponse
 * - LocationMapper: Location <-> LocationResponse
 * - InventoryMapper: Inventory <-> InventoryResponse
 * - MovementMapper: InventoryMovement <-> MovementResponse
 * - UserMapper: AppUser <-> UserResponse
 * 
 * Mapping rules:
 * - All mappers are marked with @Component or a custom @Mapper stereotype
 * - Methods are public and return non-null mapped objects
 * - Null input handling is consistent and documented
 * - password_hash and other sensitive fields are explicitly excluded
 */
class MapperPackageInfo {
}
