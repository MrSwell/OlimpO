package server.olimpo.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.dto.request.CreateUserRequest;
import server.olimpo.dto.request.UpdateUserRolesRequest;
import server.olimpo.dto.response.UserResponse;
import server.olimpo.dto.response.PageResponse;
import server.olimpo.entity.Trainer;
import server.olimpo.entity.User;
import server.olimpo.enums.UserStatus;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.TrainerRepository;
import server.olimpo.repository.UserRepository;
import server.olimpo.util.Pagination;

import java.util.HashSet;
import java.util.Collection;
import java.util.Map;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    /** Roles that can be assigned through user management. CLIENT excluded. */
    private static final Set<String> STAFF_ROLES =
            new LinkedHashSet<>(List.of("ADMIN", "RECEPCIONIST", "TRAINER_MANAGER", "TRAINER"));

    private final UserRepository userRepository;
    private final TrainerRepository trainerRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       TrainerRepository trainerRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.trainerRepository = trainerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request, Authentication authentication) {
        String email = request.email().trim().toLowerCase();

        // Validation runs before any DB write and before the caller check.
        Set<String> normalizedRoles = validateStaffRoles(request.roles());

        // Privilege-escalation guard: only ADMIN may mint ADMIN accounts
        // (PATCH /users/{id}/roles is already ADMIN-only; POST must match that).
        if (normalizedRoles.contains("ADMIN") && !hasAuthority(authentication, "ROLE_ADMIN")) {
            throw new AccessDeniedException("Only ADMIN can assign the ADMIN role");
        }

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("A user with this email already exists: " + email);
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .phone(request.phone())
                .status(UserStatus.ACTIVE.name())
                .build();
        user = userRepository.save(user);

        List<String> assignedRoles = assignRoles(user.getId(), request.roles());
        return toResponse(user, assignedRoles);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(String search, Pageable pageable) {
        var users = userRepository.searchUsers(Pagination.normalizeSearch(search), pageable);
        Collection<Long> userIds = users.getContent().stream().map(User::getId).toList();
        Map<Long, List<String>> rolesByUserId = userIds.isEmpty()
                ? Map.of()
                : userRepository.findRoleNamesByUserIds(userIds).stream()
                .collect(Collectors.groupingBy(UserRepository.UserRoleNameProjection::getUserId,
                        Collectors.mapping(UserRepository.UserRoleNameProjection::getRoleName,
                                Collectors.toList())));
        return PageResponse.from(users.map(user ->
                toResponse(user, rolesByUserId.getOrDefault(user.getId(), List.of()))));
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toResponse(user, userRepository.findRoleNamesByUserId(id));
    }

    @Transactional
    public UserResponse updateUserRoles(Long id, UpdateUserRolesRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        validateStaffRoles(request.roles());
        userRepository.deleteUserRoles(id);
        List<String> assignedRoles = assignRoles(id, request.roles());

        return new UserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                user.getPhone(), user.getStatus(), assignedRoles, user.getCreatedAt());
    }

    private Set<String> validateStaffRoles(List<String> roles) {
        if (roles == null || roles.isEmpty()) {
            throw new IllegalArgumentException("At least one role is required");
        }

        Set<String> normalized = new HashSet<>();
        for (String role : roles) {
            String normalizedRole = role.trim().toUpperCase();
            if ("CLIENT".equals(normalizedRole)) {
                throw new IllegalArgumentException(
                        "Role CLIENT cannot be assigned via user management. Clients are registered through /api/v1/clients");
            }
            if (!STAFF_ROLES.contains(normalizedRole)) {
                throw new IllegalArgumentException("Invalid role: " + role + ". Allowed roles: " + STAFF_ROLES);
            }
            if (!normalized.add(normalizedRole)) {
                throw new IllegalArgumentException("Duplicate role in request: " + role);
            }
        }
        return normalized;
    }

    private boolean hasAuthority(Authentication authentication, String authority) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(authority));
    }

    private List<String> assignRoles(Long userId, List<String> roles) {
        List<String> assigned = roles.stream()
                .map(role -> {
                    String normalizedRole = role.trim().toUpperCase();
                    Integer roleId = userRepository.findRoleIdByName(normalizedRole)
                            .orElseThrow(() -> new BusinessException("Role not found in database: " + normalizedRole));
                    userRepository.insertUserRole(userId, roleId);
                    return normalizedRole;
                })
                .toList();
        if (assigned.contains("TRAINER")) {
            ensureTrainerProfile(userId);
        }
        return assigned;
    }

    /** Every user with the TRAINER role must have a trainers row (used by schedules/routines). */
    private void ensureTrainerProfile(Long userId) {
        if (!trainerRepository.existsByUserId(userId)) {
            trainerRepository.save(Trainer.builder().userId(userId).build());
        }
    }

    private UserResponse toResponse(User user, List<String> roles) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                user.getPhone(), user.getStatus(), roles, user.getCreatedAt());
    }
}
