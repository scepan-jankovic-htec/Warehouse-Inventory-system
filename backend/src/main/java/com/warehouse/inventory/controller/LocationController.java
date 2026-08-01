package com.warehouse.inventory.controller;

import com.warehouse.inventory.domain.Location;
import com.warehouse.inventory.dto.request.CreateLocationRequest;
import com.warehouse.inventory.dto.request.UpdateLocationRequest;
import com.warehouse.inventory.dto.response.DataResponse;
import com.warehouse.inventory.repository.LocationRepository;
import com.warehouse.inventory.service.LocationQuery;
import com.warehouse.inventory.service.LocationService;
import com.warehouse.inventory.service.LocationService.LocationView;
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
 * REST controller for {@code /locations}.
 *
 * <p>HTTP mapping only — all business logic is delegated to {@link LocationService}.</p>
 */
@RestController
@RequestMapping("/locations")
public class LocationController {

    private final LocationService locationService;
    private final LocationRepository locationRepository;

    public LocationController(LocationService locationService, LocationRepository locationRepository) {
        this.locationService = locationService;
        this.locationRepository = locationRepository;
    }

    // -------------------------------------------------------------------------
    // GET /locations
    // Paginated, filtered, sorted location list.
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<PageResult<LocationView>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        List<Location> all = locationRepository.findAll();
        PageResult<LocationView> result = locationService.findAll(all,
                new LocationQuery(search, type, active, sortBy, sortDir, page, size));
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // GET /locations/{id}
    // Single location by ID. 404 when not found.
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<DataResponse<LocationView>> findById(@PathVariable Integer id) {
        List<Location> all = locationRepository.findAll();
        LocationView view = locationService.findById(all, id);
        return ResponseEntity.ok(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // POST /locations  [ADMIN]
    // Creates a new location. 409 when name conflicts.
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<DataResponse<LocationView>> create(
            @Valid @RequestBody CreateLocationRequest request) {

        List<Location> existing = locationRepository.findAll();
        Location saved = locationService.create(existing, request);
        LocationView view = locationService.findById(List.of(saved), saved.getId());
        return ResponseEntity.status(201).body(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // PUT /locations/{id}  [ADMIN]
    // Updates an existing location. 404 when not found.
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<DataResponse<LocationView>> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateLocationRequest request) {

        List<Location> existing = locationRepository.findAll();
        Location saved = locationService.update(existing, id, request);
        LocationView view = locationService.findById(List.of(saved), saved.getId());
        return ResponseEntity.ok(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // PATCH /locations/{id}/deactivate  [ADMIN]
    // Deactivates a location. 422 when already inactive.
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        List<Location> existing = locationRepository.findAll();
        locationService.deactivate(existing, id);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // PATCH /locations/{id}/activate  [ADMIN]
    // Reactivates a previously deactivated location.
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Integer id) {
        List<Location> existing = locationRepository.findAll();
        locationService.activate(existing, id);
        return ResponseEntity.noContent().build();
    }
}
