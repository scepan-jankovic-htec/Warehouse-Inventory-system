package com.warehouse.inventory.controller;

import com.warehouse.inventory.domain.AppUser;
import com.warehouse.inventory.dto.request.CreateUserRequest;
import com.warehouse.inventory.dto.request.UpdateUserRequest;
import com.warehouse.inventory.dto.response.DataResponse;
import com.warehouse.inventory.repository.UserRepository;
import com.warehouse.inventory.service.PageResult;
import com.warehouse.inventory.service.UserQuery;
import com.warehouse.inventory.service.UserService;
import com.warehouse.inventory.service.UserService.UserView;
import com.warehouse.inventory.domain.enums.UserRole;
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
 * REST controller for {@code /users}.
 *
 * <p>HTTP mapping only — all business logic is delegated to {@link UserService}.</p>
 * <p>Password hash is never present in any response.</p>
 */
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    // -------------------------------------------------------------------------
    // GET /users  [ADMIN]
    // Paginated, filtered, sorted user list. Password hash never in response.
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<PageResult<UserView>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        List<AppUser> users = userRepository.findAll();
        PageResult<UserView> result = userService.findAll(users,
                new UserQuery(search, role, active, sortBy, sortDir, page, size));
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // GET /users/{id}  [ADMIN]
    // Single user by ID. 404 when not found. Password hash never in response.
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<DataResponse<UserView>> findById(@PathVariable Integer id) {
        List<AppUser> users = userRepository.findAll();
        UserView view = userService.findById(users, id);
        return ResponseEntity.ok(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // POST /users  [ADMIN]
    // Creates a new user. 409 when username or email already exists.
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<DataResponse<UserView>> create(
            @Valid @RequestBody CreateUserRequest request) {

        List<AppUser> existing = userRepository.findAll();
        AppUser saved = userService.create(existing, request);
        UserView view = userService.findById(List.of(saved), saved.getId());
        return ResponseEntity.status(201).body(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // PUT /users/{id}  [ADMIN]
    // Updates user profile (fullName, email, role). Password updated separately.
    // 404 when not found.
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<DataResponse<UserView>> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserRequest request) {

        List<AppUser> existing = userRepository.findAll();
        AppUser saved = userService.update(existing, id, request);
        UserView view = userService.findById(List.of(saved), saved.getId());
        return ResponseEntity.ok(DataResponse.of(view));
    }

    // -------------------------------------------------------------------------
    // PATCH /users/{id}/deactivate  [ADMIN]
    // Deactivates a user account. 422 when already inactive.
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        List<AppUser> existing = userRepository.findAll();
        userService.deactivate(existing, id);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // PATCH /users/{id}/activate  [ADMIN]
    // Reactivates a previously deactivated user account.
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Integer id) {
        List<AppUser> existing = userRepository.findAll();
        userService.activate(existing, id);
        return ResponseEntity.noContent().build();
    }
}
