package com.warehouse.inventory.controller;

import com.warehouse.inventory.domain.Category;
import com.warehouse.inventory.domain.Inventory;
import com.warehouse.inventory.domain.Product;
import com.warehouse.inventory.dto.request.CreateProductRequest;
import com.warehouse.inventory.dto.request.UpdateProductRequest;
import com.warehouse.inventory.dto.response.DataResponse;
import com.warehouse.inventory.repository.CategoryRepository;
import com.warehouse.inventory.repository.InventoryRepository;
import com.warehouse.inventory.repository.ProductRepository;
import com.warehouse.inventory.service.PageResult;
import com.warehouse.inventory.service.ProductQuery;
import com.warehouse.inventory.service.ProductService;
import com.warehouse.inventory.service.ProductService.ProductDetailView;
import com.warehouse.inventory.service.ProductService.ProductView;
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
 * REST controller for {@code /products}.
 *
 * <p>HTTP mapping only — all business logic is delegated to {@link ProductService}.</p>
 */
@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;

    public ProductController(
            ProductService productService,
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            InventoryRepository inventoryRepository) {
        this.productService = productService;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryRepository = inventoryRepository;
    }

    // -------------------------------------------------------------------------
    // GET /products
    // Paginated, filtered, sorted product list.
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<PageResult<ProductView>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        List<Product> products = productRepository.findAll();
        PageResult<ProductView> result = productService.findAll(products,
                new ProductQuery(search, categoryId, active, sortBy, sortDir, page, size));
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // GET /products/{id}
    // Single product with current inventory by location. 404 when not found.
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<DataResponse<ProductDetailView>> findById(@PathVariable Integer id) {
        List<Product> products = productRepository.findAll();
        List<Inventory> inventories = inventoryRepository.findAll();
        ProductDetailView view = productService.findById(products, inventories, id);
        return ResponseEntity.ok(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // POST /products  [ADMIN]
    // Creates a new product. 409 on duplicate SKU, 422 on inactive category.
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<DataResponse<ProductDetailView>> create(
            @Valid @RequestBody CreateProductRequest request) {

        List<Product> existing = productRepository.findAll();
        List<Category> categories = categoryRepository.findAll();
        Product saved = productService.create(existing, categories, request);

        // Newly created product has no inventory yet; pass empty list.
        ProductDetailView view = productService.findById(
                productRepository.findAll(), List.of(), saved.getId());
        return ResponseEntity.status(201).body(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // PUT /products/{id}  [ADMIN]
    // Updates product fields (SKU is immutable). 404 / 422 as appropriate.
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<DataResponse<ProductDetailView>> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateProductRequest request) {

        List<Product> existing = productRepository.findAll();
        List<Category> categories = categoryRepository.findAll();
        productService.update(existing, categories, id, request);

        List<Inventory> inventories = inventoryRepository.findAll();
        ProductDetailView view = productService.findById(productRepository.findAll(), inventories, id);
        return ResponseEntity.ok(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // PATCH /products/{id}/deactivate  [ADMIN]
    // Deactivates a product. 422 when already inactive.
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        List<Product> existing = productRepository.findAll();
        productService.deactivate(existing, id);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // PATCH /products/{id}/activate  [ADMIN]
    // Reactivates a previously deactivated product.
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Integer id) {
        List<Product> existing = productRepository.findAll();
        productService.activate(existing, id);
        return ResponseEntity.noContent().build();
    }
}
