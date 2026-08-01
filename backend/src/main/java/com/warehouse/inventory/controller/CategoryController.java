package com.warehouse.inventory.controller;

import com.warehouse.inventory.domain.Category;
import com.warehouse.inventory.dto.request.CreateCategoryRequest;
import com.warehouse.inventory.dto.request.UpdateCategoryRequest;
import com.warehouse.inventory.dto.response.DataResponse;
import com.warehouse.inventory.repository.CategoryRepository;
import com.warehouse.inventory.service.CategoryQuery;
import com.warehouse.inventory.service.CategoryService;
import com.warehouse.inventory.service.CategoryService.CategoryView;
import com.warehouse.inventory.service.PageResult;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for {@code /categories}.
 *
 * <p>HTTP mapping only — all business logic is delegated to {@link CategoryService}.</p>
 */
@RestController
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryService categoryService, CategoryRepository categoryRepository) {
        this.categoryService = categoryService;
        this.categoryRepository = categoryRepository;
    }

    // -------------------------------------------------------------------------
    // GET /categories
    // Returns a paginated, filtered, sorted list of categories.
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<PageResult<CategoryView>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        List<Category> all = categoryRepository.findAll();
        PageResult<CategoryView> result = categoryService.findAll(all,
                new CategoryQuery(search, active, sortBy, sortDir, page, size));
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // GET /categories/{id}
    // Returns a single category by ID. 404 when not found.
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<DataResponse<CategoryView>> findById(@PathVariable Integer id) {
        List<Category> all = categoryRepository.findAll();
        CategoryView view = categoryService.findById(all, id);
        return ResponseEntity.ok(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // POST /categories  [ADMIN]
    // Creates a new category. 409 when name conflicts.
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<DataResponse<CategoryView>> create(
            @Valid @RequestBody CreateCategoryRequest request) {

        List<Category> existing = categoryRepository.findAll();
        Category saved = categoryService.create(existing, request);
        CategoryView view = categoryService.findById(List.of(saved), saved.getId());
        return ResponseEntity.status(201).body(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // PUT /categories/{id}  [ADMIN]
    // Updates an existing category. 404 / 409 as appropriate.
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<DataResponse<CategoryView>> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateCategoryRequest request) {

        List<Category> existing = categoryRepository.findAll();
        Category saved = categoryService.update(existing, id, request);
        // Reload all so productCount is accurate via the lazy collection.
        CategoryView view = categoryService.findById(categoryRepository.findAll(), saved.getId());
        return ResponseEntity.ok(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // PATCH /categories/{id}/deactivate  [ADMIN]
    // Deactivates a category. 422 when already inactive.
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        List<Category> existing = categoryRepository.findAll();
        categoryService.deactivate(existing, id);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // PATCH /categories/{id}/activate  [ADMIN]
    // Reactivates a previously deactivated category. 404 when not found.
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Integer id) {
        List<Category> existing = categoryRepository.findAll();
        categoryService.activate(existing, id);
        return ResponseEntity.noContent().build();
    }
}
