package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.Location;
import com.warehouse.inventory.domain.enums.LocationType;
import com.warehouse.inventory.dto.request.CreateLocationRequest;
import com.warehouse.inventory.dto.request.UpdateLocationRequest;
import com.warehouse.inventory.repository.LocationRepository;
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
public class LocationService extends ServiceValidationSupport {

    private final LocationRepository locationRepository;

    public LocationService(Validator validator, LocationRepository locationRepository) {
        super(validator);
        this.locationRepository = locationRepository;
    }

    public PageResult<LocationView> findAll(Collection<Location> locations, LocationQuery query) {
        Objects.requireNonNull(locations, "Locations must not be null.");
        Objects.requireNonNull(query, "Query must not be null.");

        int page = normalizePage(query.page());
        int size = normalizeSize(query.size());

        List<LocationView> result = locations.stream()
            .filter(location -> matchesSearch(location, query.search()))
            .filter(location -> matchesType(location, query.type()))
            .filter(location -> query.active() == null || location.isActive() == query.active())
            .map(this::toLocationView)
            .sorted(locationComparator(query.sortBy(), query.sortDir()))
            .toList();

        return PageResult.of(result, page, size);
    }

    public LocationView findById(Collection<Location> locations, Integer locationId) {
        return toLocationView(resolveLocation(locations, locationId));
    }

    @Transactional
    public Location create(Collection<Location> existingLocations, CreateLocationRequest request) {
        Objects.requireNonNull(existingLocations, "Locations must not be null.");
        validate(request);
        ensureUniqueName(existingLocations, request.name(), null);

        Location location = new Location();
        location.setName(request.name().trim());
        location.setType(LocationType.valueOf(request.type().trim().toUpperCase(Locale.ROOT)));
        location.setAddress(normalizeNullableText(request.address()));
        location.setActive(true);
        return locationRepository.save(location);
    }

    @Transactional
    public Location update(Collection<Location> existingLocations, Integer locationId, UpdateLocationRequest request) {
        Objects.requireNonNull(existingLocations, "Locations must not be null.");
        validate(request);

        Location location = resolveLocation(existingLocations, locationId);
        ensureUniqueName(existingLocations, request.name(), location.getId());

        location.setName(request.name().trim());
        location.setType(LocationType.valueOf(request.type().trim().toUpperCase(Locale.ROOT)));
        location.setAddress(normalizeNullableText(request.address()));
        return locationRepository.save(location);
    }

    @Transactional
    public void deactivate(Collection<Location> locations, Integer locationId) {
        Location location = resolveLocation(locations, locationId);
        if (!location.isActive()) {
            throw new IllegalStateException("Location is already inactive.");
        }
        location.setActive(false);
        locationRepository.save(location);
    }

    @Transactional
    public void activate(Collection<Location> locations, Integer locationId) {
        Location location = resolveLocation(locations, locationId);
        location.setActive(true);
        locationRepository.save(location);
    }

    public Location resolveActiveLocation(Collection<Location> locations, Integer locationId) {
        Location location = resolveLocation(locations, locationId);
        if (!location.isActive()) {
            throw new IllegalStateException("Location is inactive.");
        }
        return location;
    }

    public Location resolveActiveLocation(Integer locationId) {
        Objects.requireNonNull(locationId, "Location ID must not be null.");
        Location location = locationRepository.findById(locationId)
            .orElseThrow(() -> new NoSuchElementException("Location not found for id=" + locationId));
        if (!location.isActive()) {
            throw new IllegalStateException("Location is inactive.");
        }
        return location;
    }

    private Location resolveLocation(Collection<Location> locations, Integer locationId) {
        Objects.requireNonNull(locations, "Locations must not be null.");
        Objects.requireNonNull(locationId, "Location ID must not be null.");

        return locations.stream()
            .filter(location -> Objects.equals(location.getId(), locationId))
            .findFirst()
            .orElseThrow(() -> new NoSuchElementException("Location not found for id=" + locationId));
    }

    private void ensureUniqueName(Collection<Location> locations, String name, Integer currentId) {
        String normalized = name.trim().toLowerCase(Locale.ROOT);

        boolean exists = locations.stream()
            .filter(location -> currentId == null || !Objects.equals(location.getId(), currentId))
            .map(Location::getName)
            .filter(Objects::nonNull)
            .map(existingName -> existingName.trim().toLowerCase(Locale.ROOT))
            .anyMatch(normalized::equals);

        if (exists) {
            throw new IllegalArgumentException("Location name already exists.");
        }
    }

    private boolean matchesSearch(Location location, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        return location.getName() != null
            && location.getName().toLowerCase(Locale.ROOT).contains(search.trim().toLowerCase(Locale.ROOT));
    }

    private boolean matchesType(Location location, String type) {
        if (type == null || type.isBlank()) {
            return true;
        }
        return location.getType() != null && location.getType().name().equalsIgnoreCase(type.trim());
    }

    private Comparator<LocationView> locationComparator(String sortBy, String sortDir) {
        Comparator<LocationView> comparator = switch (sortBy == null ? "name" : sortBy) {
            case "type" -> Comparator.comparing(view -> view.type().name());
            case "createdAt" -> Comparator.comparing(LocationView::createdAt, Comparator.nullsLast(LocalDateTime::compareTo));
            case "name" -> Comparator.comparing(LocationView::name, String.CASE_INSENSITIVE_ORDER);
            default -> Comparator.comparing(LocationView::name, String.CASE_INSENSITIVE_ORDER);
        };
        return "desc".equalsIgnoreCase(sortDir) ? comparator.reversed() : comparator;
    }

    private LocationView toLocationView(Location location) {
        return new LocationView(
            location.getId(),
            location.getName(),
            location.getType(),
            location.getAddress(),
            location.isActive(),
            location.getCreatedAt(),
            location.getUpdatedAt()
        );
    }

    private String normalizeNullableText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record LocationView(
        Integer id,
        String name,
        LocationType type,
        String address,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }
}
