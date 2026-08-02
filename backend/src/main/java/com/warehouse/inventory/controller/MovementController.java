package com.warehouse.inventory.controller;

import com.warehouse.inventory.domain.AppUser;
import com.warehouse.inventory.domain.enums.MovementType;
import com.warehouse.inventory.dto.request.AdjustStockRequest;
import com.warehouse.inventory.dto.request.ReceiveStockRequest;
import com.warehouse.inventory.dto.request.TransferStockRequest;
import com.warehouse.inventory.dto.response.DataResponse;
import com.warehouse.inventory.repository.UserRepository;
import com.warehouse.inventory.service.MovementHistoryQuery;
import com.warehouse.inventory.service.MovementService;
import com.warehouse.inventory.service.MovementService.HistoryView;
import com.warehouse.inventory.service.MovementService.MovementResult;
import com.warehouse.inventory.service.MovementService.TransferResult;
import com.warehouse.inventory.service.PageResult;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

/**
 * REST controller for {@code /inventory/movements}.
 *
 * <p>HTTP mapping only — all business logic is delegated to {@link MovementService}.</p>
 *
 * <p>Actor resolution: the currently authenticated user is loaded from the database
 * and passed to every write operation so that movements are traceable.</p>
 */
@RestController
@RequestMapping("/inventory/movements")
public class MovementController {

    private final MovementService movementService;
    private final UserRepository userRepository;

    public MovementController(
            MovementService movementService,
            UserRepository userRepository) {
        this.movementService = movementService;
        this.userRepository = userRepository;
    }

    // -------------------------------------------------------------------------
    // POST /inventory/movements/receive  [ADMIN, WAREHOUSE_OPERATOR]
    // Records a stock-receiving operation; increases on-hand quantity.
    // 400 on validation failure; 422 when product or location is inactive.
    // -------------------------------------------------------------------------

    @PostMapping("/receive")
    public ResponseEntity<DataResponse<MovementResult>> receive(
            @Valid @RequestBody ReceiveStockRequest request) {

        AppUser actor = resolveCurrentActor();
        MovementResult result = movementService.receive(actor, request);
        return ResponseEntity.status(201).body(DataResponse.of(result));
    }

    // -------------------------------------------------------------------------
    // POST /inventory/movements/transfer  [ADMIN, WAREHOUSE_OPERATOR]
    // Transfers stock between two locations; creates TRANSFER_OUT + TRANSFER_IN pair.
    // 400 when source == destination; 422 on insufficient stock or inactive resource.
    // -------------------------------------------------------------------------

    @PostMapping("/transfer")
    public ResponseEntity<DataResponse<TransferResult>> transfer(
            @Valid @RequestBody TransferStockRequest request) {

        AppUser actor = resolveCurrentActor();
        TransferResult result = movementService.transfer(actor, request);
        return ResponseEntity.status(201).body(DataResponse.of(result));
    }

    // -------------------------------------------------------------------------
    // POST /inventory/movements/adjust  [ADMIN, WAREHOUSE_OPERATOR]
    // Records a manual stock adjustment (positive or negative).
    // 400 when reason is blank or quantityDelta is zero.
    // 422 when adjustment results in negative stock or resource is inactive.
    // -------------------------------------------------------------------------

    @PostMapping("/adjust")
    public ResponseEntity<DataResponse<MovementResult>> adjust(
            @Valid @RequestBody AdjustStockRequest request) {

        AppUser actor = resolveCurrentActor();
        MovementResult result = movementService.adjust(actor, request);
        return ResponseEntity.status(201).body(DataResponse.of(result));
    }

    // -------------------------------------------------------------------------
    // GET /inventory/movements
    // Paginated movement history with filtering by product, location, type, date.
    // 400 when dateFrom is after dateTo.
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<PageResult<HistoryView>> findAll(
            @RequestParam(required = false) Integer productId,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) MovementType movementType,
            @RequestParam(required = false) Integer performedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        PageResult<HistoryView> result = movementService.findAll(
                new MovementHistoryQuery(
                        productId, locationId, movementType, performedBy,
                        dateFrom, dateTo, sortBy, sortDir, page, size));
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // GET /inventory/movements/{id}
    // Single movement record by ID. 404 when not found.
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<DataResponse<HistoryView>> findById(@PathVariable Integer id) {
        HistoryView view = movementService.findById(id);
        return ResponseEntity.ok(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // Helper: resolve the currently authenticated user from the security context.
    // Throws 401 if authentication is missing or the user cannot be found.
    // -------------------------------------------------------------------------

    private AppUser resolveCurrentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentication is required to perform inventory operations.");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found in the system."));
    }
}
