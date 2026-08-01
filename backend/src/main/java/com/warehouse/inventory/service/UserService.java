package com.warehouse.inventory.service;

import com.warehouse.inventory.domain.AppUser;
import com.warehouse.inventory.domain.enums.UserRole;
import com.warehouse.inventory.dto.request.CreateUserRequest;
import com.warehouse.inventory.dto.request.UpdateUserRequest;
import jakarta.validation.Validator;
import org.springframework.security.crypto.password.PasswordEncoder;
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
public class UserService extends ServiceValidationSupport {

    private final PasswordEncoder passwordEncoder;

    public UserService(Validator validator, PasswordEncoder passwordEncoder) {
        super(validator);
        this.passwordEncoder = passwordEncoder;
    }

    public PageResult<UserView> findAll(Collection<AppUser> users, UserQuery query) {
        Objects.requireNonNull(users, "Users must not be null.");
        Objects.requireNonNull(query, "Query must not be null.");

        int page = normalizePage(query.page());
        int size = normalizeSize(query.size());

        List<UserView> result = users.stream()
            .filter(user -> matchesSearch(user, query.search()))
            .filter(user -> query.role() == null || user.getRole() == query.role())
            .filter(user -> query.active() == null || user.isActive() == query.active())
            .map(this::toUserView)
            .sorted(userComparator(query.sortBy(), query.sortDir()))
            .toList();

        return PageResult.of(result, page, size);
    }

    public UserView findById(Collection<AppUser> users, Long userId) {
        return toUserView(resolveUser(users, userId));
    }

    @Transactional
    public AppUser create(Collection<AppUser> existingUsers, CreateUserRequest request) {
        Objects.requireNonNull(existingUsers, "Users must not be null.");
        validate(request);
        ensureUniqueUsername(existingUsers, request.username(), null);
        ensureUniqueEmail(existingUsers, request.email(), null);

        AppUser user = new AppUser();
        user.setUsername(request.username().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setRole(UserRole.valueOf(request.role().trim().toUpperCase(Locale.ROOT)));
        user.setActive(true);
        return user;
    }

    @Transactional
    public AppUser update(Collection<AppUser> existingUsers, Long userId, UpdateUserRequest request) {
        Objects.requireNonNull(existingUsers, "Users must not be null.");
        validate(request);

        AppUser user = resolveUser(existingUsers, userId);
        ensureUniqueEmail(existingUsers, request.email(), user.getId());

        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setRole(UserRole.valueOf(request.role().trim().toUpperCase(Locale.ROOT)));
        return user;
    }

    @Transactional
    public void deactivate(Collection<AppUser> users, Long userId) {
        AppUser user = resolveUser(users, userId);
        if (!user.isActive()) {
            throw new IllegalStateException("User is already inactive.");
        }
        user.setActive(false);
    }

    @Transactional
    public void activate(Collection<AppUser> users, Long userId) {
        resolveUser(users, userId).setActive(true);
    }

    private AppUser resolveUser(Collection<AppUser> users, Long userId) {
        Objects.requireNonNull(users, "Users must not be null.");
        Objects.requireNonNull(userId, "User ID must not be null.");

        return users.stream()
            .filter(user -> Objects.equals(user.getId(), userId))
            .findFirst()
            .orElseThrow(() -> new NoSuchElementException("User not found for id=" + userId));
    }

    private void ensureUniqueUsername(Collection<AppUser> users, String username, Long currentId) {
        String normalized = username.trim().toLowerCase(Locale.ROOT);
        boolean exists = users.stream()
            .filter(user -> currentId == null || !Objects.equals(user.getId(), currentId))
            .map(AppUser::getUsername)
            .filter(Objects::nonNull)
            .map(existingUsername -> existingUsername.trim().toLowerCase(Locale.ROOT))
            .anyMatch(normalized::equals);

        if (exists) {
            throw new IllegalArgumentException("Username already exists.");
        }
    }

    private void ensureUniqueEmail(Collection<AppUser> users, String email, Long currentId) {
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        boolean exists = users.stream()
            .filter(user -> currentId == null || !Objects.equals(user.getId(), currentId))
            .map(AppUser::getEmail)
            .filter(Objects::nonNull)
            .map(existingEmail -> existingEmail.trim().toLowerCase(Locale.ROOT))
            .anyMatch(normalized::equals);

        if (exists) {
            throw new IllegalArgumentException("Email already exists.");
        }
    }

    private boolean matchesSearch(AppUser user, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }

        String normalized = search.trim().toLowerCase(Locale.ROOT);
        return (user.getUsername() != null && user.getUsername().toLowerCase(Locale.ROOT).contains(normalized))
            || (user.getFullName() != null && user.getFullName().toLowerCase(Locale.ROOT).contains(normalized));
    }

    private Comparator<UserView> userComparator(String sortBy, String sortDir) {
        Comparator<UserView> comparator = switch (sortBy == null ? "username" : sortBy) {
            case "fullName" -> Comparator.comparing(view -> nullSafe(view.fullName()), String.CASE_INSENSITIVE_ORDER);
            case "role" -> Comparator.comparing(view -> view.role().name());
            case "username" -> Comparator.comparing(view -> nullSafe(view.username()), String.CASE_INSENSITIVE_ORDER);
            default -> Comparator.comparing(view -> nullSafe(view.username()), String.CASE_INSENSITIVE_ORDER);
        };

        return "desc".equalsIgnoreCase(sortDir) ? comparator.reversed() : comparator;
    }

    private UserView toUserView(AppUser user) {
        return new UserView(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.isActive(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    public record UserView(
        Long id,
        String username,
        String fullName,
        String email,
        UserRole role,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
    }
}
