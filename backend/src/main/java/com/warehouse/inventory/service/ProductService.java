package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.Category;
import com.warehouse.inventory.domain.Inventory;
import com.warehouse.inventory.domain.Location;
import com.warehouse.inventory.domain.Product;
import com.warehouse.inventory.domain.enums.LocationType;
import com.warehouse.inventory.domain.enums.StockStatus;
import com.warehouse.inventory.dto.request.CreateProductRequest;
import com.warehouse.inventory.dto.request.UpdateProductRequest;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class ProductService extends ServiceValidationSupport {

    public ProductService(Validator validator) {
        super(validator);
    }

    public PageResult<ProductView> findAll(Collection<Product> products, ProductQuery query) {
        Objects.requireNonNull(products, "Products must not be null.");
        Objects.requireNonNull(query, "Query must not be null.");

        int page = normalizePage(query.page());
        int size = normalizeSize(query.size());

        List<ProductView> result = products.stream()
            .filter(product -> matchesSearch(product, query.search()))
            .filter(product -> query.categoryId() == null || matchesCategoryId(product, query.categoryId()))
            .filter(product -> query.active() == null || product.isActive() == query.active())
            .map(this::toProductView)
            .sorted(productComparator(query.sortBy(), query.sortDir()))
            .toList();

        return PageResult.of(result, page, size);
    }

    public ProductDetailView findById(Collection<Product> products, Collection<Inventory> inventories, Long productId) {
        Product product = resolveProduct(products, productId);

        List<ProductInventoryView> inventoryViews = inventories.stream()
            .filter(inventory -> inventory.getProduct() != null)
            .filter(inventory -> Objects.equals(inventory.getProduct().getId(), productId))
            .map(this::toProductInventoryView)
            .sorted(Comparator.comparing(ProductInventoryView::locationName, String.CASE_INSENSITIVE_ORDER))
            .toList();

        return toProductDetailView(product, inventoryViews);
    }

    @Transactional
    public Product create(Collection<Product> existingProducts, Collection<Category> categories, CreateProductRequest request) {
        Objects.requireNonNull(existingProducts, "Products must not be null.");
        Objects.requireNonNull(categories, "Categories must not be null.");
        validate(request);

        ensureUniqueSku(existingProducts, request.sku(), null);
        Category category = resolveActiveCategory(categories, request.categoryId());

        Product product = new Product();
        product.setSku(request.sku().trim().toUpperCase(Locale.ROOT));
        product.setName(request.name().trim());
        product.setDescription(normalizeNullableText(request.description()));
        product.setCategory(category);
        product.setUnitOfMeasure(request.unitOfMeasure().trim().toUpperCase(Locale.ROOT));
        product.setReorderThreshold(request.reorderThreshold() == null ? 0 : request.reorderThreshold());
        product.setActive(true);
        return product;
    }

    @Transactional
    public Product update(Collection<Product> existingProducts, Collection<Category> categories, Long productId, UpdateProductRequest request) {
        Objects.requireNonNull(existingProducts, "Products must not be null.");
        Objects.requireNonNull(categories, "Categories must not be null.");
        validate(request);

        Product product = resolveProduct(existingProducts, productId);
        Category category = resolveActiveCategory(categories, request.categoryId());

        product.setName(request.name().trim());
        product.setDescription(normalizeNullableText(request.description()));
        product.setCategory(category);
        product.setUnitOfMeasure(request.unitOfMeasure().trim().toUpperCase(Locale.ROOT));
        product.setReorderThreshold(request.reorderThreshold() == null ? 0 : request.reorderThreshold());
        return product;
    }

    @Transactional
    public void deactivate(Collection<Product> products, Long productId) {
        Product product = resolveProduct(products, productId);
        if (!product.isActive()) {
            throw new IllegalStateException("Product is already inactive.");
        }
        product.setActive(false);
    }

    @Transactional
    public void activate(Collection<Product> products, Long productId) {
        resolveProduct(products, productId).setActive(true);
    }

    public Product resolveActiveProduct(Collection<Product> products, Long productId) {
        Product product = resolveProduct(products, productId);
        if (!product.isActive()) {
            throw new IllegalStateException("Product is inactive.");
        }
        return product;
    }

    private Product resolveProduct(Collection<Product> products, Long productId) {
        Objects.requireNonNull(products, "Products must not be null.");
        Objects.requireNonNull(productId, "Product ID must not be null.");

        return products.stream()
            .filter(product -> Objects.equals(product.getId(), productId))
            .findFirst()
            .orElseThrow(() -> new NoSuchElementException("Product not found for id=" + productId));
    }

    private Category resolveActiveCategory(Collection<Category> categories, Long categoryId) {
        Category category = categories.stream()
            .filter(candidate -> Objects.equals(candidate.getId(), categoryId))
            .findFirst()
            .orElseThrow(() -> new NoSuchElementException("Category not found for id=" + categoryId));

        if (!category.isActive()) {
            throw new IllegalStateException("Category is inactive.");
        }
        return category;
    }

    private void ensureUniqueSku(Collection<Product> products, String sku, Long currentId) {
        String normalized = sku.trim().toUpperCase(Locale.ROOT);

        boolean exists = products.stream()
            .filter(product -> currentId == null || !Objects.equals(product.getId(), currentId))
            .map(Product::getSku)
            .filter(Objects::nonNull)
            .map(existingSku -> existingSku.trim().toUpperCase(Locale.ROOT))
            .anyMatch(normalized::equals);

        if (exists) {
            throw new IllegalArgumentException("Product SKU already exists.");
        }
    }

    private boolean matchesSearch(Product product, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }

        String normalized = search.trim().toLowerCase(Locale.ROOT);
        return (product.getSku() != null && product.getSku().toLowerCase(Locale.ROOT).contains(normalized))
            || (product.getName() != null && product.getName().toLowerCase(Locale.ROOT).contains(normalized));
    }

    private boolean matchesCategoryId(Product product, Long categoryId) {
        return product.getCategory() != null && Objects.equals(product.getCategory().getId(), categoryId);
    }

    private Comparator<ProductView> productComparator(String sortBy, String sortDir) {
        Comparator<ProductView> comparator = switch (sortBy == null ? "name" : sortBy) {
            case "sku" -> Comparator.comparing(ProductView::sku, String.CASE_INSENSITIVE_ORDER);
            case "categoryName" -> Comparator.comparing(view -> view.category().name(), String.CASE_INSENSITIVE_ORDER);
            case "createdAt" -> Comparator.comparing(ProductView::createdAt, Comparator.nullsLast(LocalDateTime::compareTo));
            case "name" -> Comparator.comparing(ProductView::name, String.CASE_INSENSITIVE_ORDER);
            default -> Comparator.comparing(ProductView::name, String.CASE_INSENSITIVE_ORDER);
        };

        return "desc".equalsIgnoreCase(sortDir) ? comparator.reversed() : comparator;
    }

    private ProductView toProductView(Product product) {
        return new ProductView(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getDescription(),
            new CategorySummary(product.getCategory() == null ? null : product.getCategory().getId(),
                product.getCategory() == null ? null : product.getCategory().getName()),
            product.getUnitOfMeasure(),
            product.getReorderThreshold(),
            product.isActive(),
            product.getCreatedAt(),
            product.getUpdatedAt()
        );
    }

    private ProductDetailView toProductDetailView(Product product, List<ProductInventoryView> inventory) {
        return new ProductDetailView(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getDescription(),
            new CategorySummary(product.getCategory() == null ? null : product.getCategory().getId(),
                product.getCategory() == null ? null : product.getCategory().getName()),
            product.getUnitOfMeasure(),
            product.getReorderThreshold(),
            product.isActive(),
            inventory,
            product.getCreatedAt(),
            product.getUpdatedAt()
        );
    }

    private ProductInventoryView toProductInventoryView(Inventory inventory) {
        Location location = inventory.getLocation();
        Product product = inventory.getProduct();
        return new ProductInventoryView(
            location == null ? null : location.getId(),
            location == null ? null : location.getName(),
            location == null ? null : location.getType(),
            inventory.getQuantityOnHand(),
            deriveStockStatus(inventory.getQuantityOnHand(), product == null ? 0 : product.getReorderThreshold())
        );
    }

    private StockStatus deriveStockStatus(int quantityOnHand, int reorderThreshold) {
        if (quantityOnHand == 0) {
            return StockStatus.OUT_OF_STOCK;
        }
        if (quantityOnHand <= reorderThreshold) {
            return StockStatus.LOW_STOCK;
        }
        return StockStatus.IN_STOCK;
    }

    private String normalizeNullableText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record CategorySummary(Long id, String name) {
    }

    public record ProductView(
        Long id,
        String sku,
        String name,
        String description,
        CategorySummary category,
        String unitOfMeasure,
        int reorderThreshold,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }

    public record ProductInventoryView(
        Long locationId,
        String locationName,
        LocationType locationType,
        int quantityOnHand,
        StockStatus stockStatus
    ) {
    }

    public record ProductDetailView(
        Long id,
        String sku,
        String name,
        String description,
        CategorySummary category,
        String unitOfMeasure,
        int reorderThreshold,
        boolean active,
        List<ProductInventoryView> inventory,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }
}
