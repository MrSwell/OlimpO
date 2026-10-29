package server.olimpo.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.dto.request.CreateUserRequest;
import server.olimpo.dto.request.UpdateUserRolesRequest;
import server.olimpo.dto.response.UserResponse;
import server.olimpo.entity.Trainer;
import server.olimpo.entity.User;
import server.olimpo.enums.UserStatus;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.TrainerRepository;
import server.olimpo.repository.UserRepository;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

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
    public UserResponse createUser(CreateUserRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("A user with this email already exists: " + email);
        }
        validateStaffRoles(request.roles());

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
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> toResponse(user, userRepository.findRoleNamesByUserId(user.getId())))
                .toList();
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

    private void validateStaffRoles(List<String> roles) {
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
