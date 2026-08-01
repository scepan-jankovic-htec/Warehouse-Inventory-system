package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.Category;
import com.warehouse.inventory.domain.Product;
import com.warehouse.inventory.dto.request.CreateCategoryRequest;
import com.warehouse.inventory.dto.request.UpdateCategoryRequest;
import com.warehouse.inventory.repository.CategoryRepository;
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
public class CategoryService extends ServiceValidationSupport {

    private final CategoryRepository categoryRepository;

    public CategoryService(Validator validator, CategoryRepository categoryRepository) {
        super(validator);
        this.categoryRepository = categoryRepository;
    }

    public PageResult<CategoryView> findAll(Collection<Category> categories, CategoryQuery query) {
        Objects.requireNonNull(categories, "Categories must not be null.");
        Objects.requireNonNull(query, "Query must not be null.");

        int page = normalizePage(query.page());
        int size = normalizeSize(query.size());

        List<CategoryView> result = categories.stream()
            .filter(category -> matchesCategorySearch(category, query.search()))
            .filter(category -> query.active() == null || category.isActive() == query.active())
            .map(this::toCategoryView)
            .sorted(categoryComparator(query.sortBy(), query.sortDir()))
            .toList();

        return PageResult.of(result, page, size);
    }

    public CategoryView findById(Collection<Category> categories, Integer categoryId) {
        return toCategoryView(resolveCategory(categories, categoryId));
    }

    @Transactional
    public Category create(Collection<Category> existingCategories, CreateCategoryRequest request) {
        Objects.requireNonNull(existingCategories, "Categories must not be null.");
        validate(request);
        ensureCategoryNameUnique(existingCategories, request.name(), null);

        Category category = new Category();
        category.setName(request.name().trim());
        category.setDescription(normalizeNullableText(request.description()));
        category.setActive(true);
        return categoryRepository.save(category);
    }

    @Transactional
    public Category update(Collection<Category> existingCategories, Integer categoryId, UpdateCategoryRequest request) {
        Objects.requireNonNull(existingCategories, "Categories must not be null.");
        validate(request);

        Category category = resolveCategory(existingCategories, categoryId);
        ensureCategoryNameUnique(existingCategories, request.name(), category.getId());

        category.setName(request.name().trim());
        category.setDescription(normalizeNullableText(request.description()));
        return categoryRepository.save(category);
    }

    @Transactional
    public void deactivate(Collection<Category> categories, Integer categoryId) {
        Category category = resolveCategory(categories, categoryId);
        if (!category.isActive()) {
            throw new IllegalStateException("Category is already inactive.");
        }
        category.setActive(false);
        categoryRepository.save(category);
    }

    @Transactional
    public void activate(Collection<Category> categories, Integer categoryId) {
        Category category = resolveCategory(categories, categoryId);
        category.setActive(true);
        categoryRepository.save(category);
    }

    public long countAssignedProducts(Category category, Collection<Product> products) {
        Objects.requireNonNull(category, "Category must not be null.");
        Objects.requireNonNull(products, "Products must not be null.");

        return products.stream()
            .filter(product -> product.getCategory() != null)
            .filter(product -> Objects.equals(product.getCategory().getId(), category.getId()))
            .count();
    }

    private Category resolveCategory(Collection<Category> categories, Integer categoryId) {
        Objects.requireNonNull(categories, "Categories must not be null.");
        Objects.requireNonNull(categoryId, "Category ID must not be null.");

        return categories.stream()
            .filter(category -> Objects.equals(category.getId(), categoryId))
            .findFirst()
            .orElseThrow(() -> new NoSuchElementException("Category not found for id=" + categoryId));
    }

    private void ensureCategoryNameUnique(Collection<Category> categories, String name, Integer currentCategoryId) {
        String normalized = name.trim().toLowerCase(Locale.ROOT);

        boolean exists = categories.stream()
            .filter(category -> currentCategoryId == null || !Objects.equals(category.getId(), currentCategoryId))
            .map(Category::getName)
            .filter(Objects::nonNull)
            .map(existingName -> existingName.trim().toLowerCase(Locale.ROOT))
            .anyMatch(normalized::equals);

        if (exists) {
            throw new IllegalArgumentException("Category name already exists.");
        }
    }

    private boolean matchesCategorySearch(Category category, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }

        String normalized = search.trim().toLowerCase(Locale.ROOT);
        return category.getName() != null && category.getName().toLowerCase(Locale.ROOT).contains(normalized);
    }

    private Comparator<CategoryView> categoryComparator(String sortBy, String sortDir) {
        Comparator<CategoryView> comparator = switch (sortBy == null ? "name" : sortBy) {
            case "createdAt" -> Comparator.comparing(CategoryView::createdAt, Comparator.nullsLast(LocalDateTime::compareTo));
            case "name" -> Comparator.comparing(CategoryView::name, String.CASE_INSENSITIVE_ORDER);
            default -> Comparator.comparing(CategoryView::name, String.CASE_INSENSITIVE_ORDER);
        };

        return "desc".equalsIgnoreCase(sortDir) ? comparator.reversed() : comparator;
    }

    private CategoryView toCategoryView(Category category) {
        return new CategoryView(
            category.getId(),
            category.getName(),
            category.getDescription(),
            category.isActive(),
            category.getProducts().size(),
            category.getCreatedAt(),
            category.getUpdatedAt()
        );
    }

    private String normalizeNullableText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record CategoryView(
        Integer id,
        String name,
        String description,
        boolean active,
        int productCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }
}
