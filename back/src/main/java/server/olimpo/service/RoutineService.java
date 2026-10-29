package server.olimpo.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.dto.request.CreateRoutineAssignmentRequest;
import server.olimpo.dto.request.CreateRoutineRequest;
import server.olimpo.dto.response.RoutineAssignmentResponse;
import server.olimpo.dto.response.RoutineResponse;
import server.olimpo.entity.Client;
import server.olimpo.entity.Routine;
import server.olimpo.entity.RoutineAssignment;
import server.olimpo.entity.Trainer;
import server.olimpo.entity.User;
import server.olimpo.enums.RoutineAssignmentStatus;
import server.olimpo.enums.RoutineType;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.ClientRepository;
import server.olimpo.repository.RoutineAssignmentRepository;
import server.olimpo.repository.RoutineRepository;
import server.olimpo.repository.TrainerRepository;
import server.olimpo.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class RoutineService {

    private final RoutineRepository routineRepository;
    private final RoutineAssignmentRepository assignmentRepository;
    private final TrainerRepository trainerRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public RoutineService(RoutineRepository routineRepository,
                          RoutineAssignmentRepository assignmentRepository,
                          TrainerRepository trainerRepository,
                          ClientRepository clientRepository,
                          UserRepository userRepository) {
        this.routineRepository = routineRepository;
        this.assignmentRepository = assignmentRepository;
        this.trainerRepository = trainerRepository;
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a routine. GENERAL: no trainer, no price. CUSTOM: requires price
     * and a trainer (implicit for TRAINER role; explicit for ADMIN/TRAINER_MANAGER).
     */
    @Transactional
    public RoutineResponse createRoutine(CreateRoutineRequest request, Authentication authentication) {
        assertCanManageRoutines(authentication);
        String type = validateType(request.type());
        String name = request.name().trim();

        Long trainerId = null;
        if (RoutineType.CUSTOM.name().equals(type)) {
            trainerId = resolveTrainerForCustomRoutine(request.trainerId(), authentication);
            if (request.price() == null || request.price().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("CUSTOM routines require a price greater than 0");
            }
        } else if (request.price() != null) {
            throw new IllegalArgumentException("Price is only allowed for CUSTOM routines");
        }

        Routine routine = Routine.builder()
                .trainerId(trainerId)
                .name(name)
                .type(type)
                .description(request.description())
                .price(RoutineType.CUSTOM.name().equals(type) ? request.price() : null)
                .build();
        return toResponse(routineRepository.save(routine));
    }

    @Transactional(readOnly = true)
    public List<RoutineResponse> getAllRoutines(String type) {
        List<Routine> routines = (type == null || type.isBlank())
                ? routineRepository.findAll()
                : routineRepository.findByType(validateType(type));
        return routines.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RoutineResponse getRoutineById(Long id) {
        return toResponse(getRoutineEntity(id));
    }

    @Transactional
    public RoutineAssignmentResponse assignRoutine(Long routineId, CreateRoutineAssignmentRequest request,
                                                   Authentication authentication) {
        assertCanManageRoutines(authentication);
        Routine routine = getRoutineEntity(routineId);

        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + request.clientId()));

        String status = request.status() == null
                ? RoutineAssignmentStatus.ACTIVE.name()
                : validateStatus(request.status());

        RoutineAssignment assignment = RoutineAssignment.builder()
                .routineId(routine.getId())
                .clientId(client.getId())
                .assignmentDate(LocalDate.now())
                .status(status)
                .build();
        return toAssignmentResponse(assignmentRepository.save(assignment));
    }

    /** Assignment history of one routine (staff only). */
    @Transactional(readOnly = true)
    public List<RoutineAssignmentResponse> getRoutineAssignments(Long routineId) {
        getRoutineEntity(routineId);
        return assignmentRepository.findByRoutineIdOrderByAssignmentDateDesc(routineId).stream()
                .map(this::toAssignmentResponse)
                .toList();
    }

    /** Assigned routines of one client: staff can see all; CLIENT only its own. */
    @Transactional(readOnly = true)
    public List<RoutineAssignmentResponse> getClientAssignments(Long clientId, Authentication authentication) {
        boolean isViewStaff = authentication != null && authentication.getAuthorities().stream().anyMatch(a -> {
            String authority = a.getAuthority();
            return authority.equals("ROLE_ADMIN") || authority.equals("ROLE_TRAINER_MANAGER")
                    || authority.equals("ROLE_TRAINER") || authority.equals("ROLE_RECEPCIONIST");
        });
        if (!isViewStaff) {
            Long ownClientId = resolveOwnClientId(authentication);
            if (!ownClientId.equals(clientId)) {
                throw new AccessDeniedException("Clients can only access their own routines");
            }
        }
        if (clientRepository.findById(clientId).isEmpty()) {
            throw new ResourceNotFoundException("Client not found with id: " + clientId);
        }
        return assignmentRepository.findByClientIdOrderByAssignmentDateDesc(clientId).stream()
                .map(this::toAssignmentResponse)
                .toList();
    }

    private void assertCanManageRoutines(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities().stream().noneMatch(a -> {
            String authority = a.getAuthority();
            return authority.equals("ROLE_ADMIN") || authority.equals("ROLE_TRAINER_MANAGER")
                    || authority.equals("ROLE_TRAINER");
        })) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private Long resolveTrainerForCustomRoutine(Long requestedTrainerId, Authentication authentication) {
        boolean isStaffSupervisor = authentication.getAuthorities().stream().anyMatch(a -> {
            String authority = a.getAuthority();
            return authority.equals("ROLE_ADMIN") || authority.equals("ROLE_TRAINER_MANAGER");
        });
        if (isStaffSupervisor) {
            // ADMIN/TRAINER_MANAGER: use the requested trainer, or their own profile if they have one.
            if (requestedTrainerId != null) {
                getTrainerProfile(requestedTrainerId);
                return requestedTrainerId;
            }
            return resolveOptionalOwnTrainerId(authentication);
        }
        // TRAINER: always their own profile, ignoring any trainerId in the request.
        return resolveOwnTrainerId(authentication);
    }

    private Long resolveOwnTrainerId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authentication.getName()));
        Trainer trainer = trainerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No trainer profile found for this user"));
        return trainer.getId();
    }

    private Long resolveOptionalOwnTrainerId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return null;
        }
        return trainerRepository.findByUserId(user.getId()).map(Trainer::getId).orElse(null);
    }

    private String validateType(String type) {
        try {
            return RoutineType.valueOf(type.trim().toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid routine type: " + type + ". Allowed: GENERAL, CUSTOM");
        }
    }

    private String validateStatus(String status) {
        try {
            return RoutineAssignmentStatus.valueOf(status.trim().toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid assignment status: " + status + ". Allowed: ACTIVE, COMPLETED, CANCELLED");
        }
    }

    private Trainer getTrainerProfile(Long trainerId) {
        return trainerRepository.findById(trainerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainer not found with id: " + trainerId));
    }

    private Routine getRoutineEntity(Long id) {
        return routineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Routine not found with id: " + id));
    }

    private Long resolveOwnClientId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authentication.getName()));
        Client client = clientRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No client profile found for this user"));
        return client.getId();
    }

    private RoutineResponse toResponse(Routine routine) {
        String trainerName = null;
        if (routine.getTrainerId() != null) {
            Trainer trainer = trainerRepository.findById(routine.getTrainerId()).orElse(null);
            if (trainer != null) {
                User user = userRepository.findById(trainer.getUserId()).orElse(null);
                if (user != null) {
                    trainerName = user.getFirstName() + " " + user.getLastName();
                }
            }
        }
        return new RoutineResponse(routine.getId(), routine.getTrainerId(), trainerName,
                routine.getName(), routine.getType(), routine.getDescription(), routine.getPrice());
    }

    private RoutineAssignmentResponse toAssignmentResponse(RoutineAssignment assignment) {
        Routine routine = routineRepository.findById(assignment.getRoutineId()).orElse(null);
        Client client = clientRepository.findById(assignment.getClientId()).orElse(null);
        String clientName = null;
        if (client != null) {
            User user = userRepository.findById(client.getUserId()).orElse(null);
            if (user != null) {
                clientName = user.getFirstName() + " " + user.getLastName();
            }
        }
        return new RoutineAssignmentResponse(assignment.getId(), assignment.getRoutineId(),
                routine != null ? routine.getName() : null,
                assignment.getClientId(), clientName,
                assignment.getAssignmentDate(), assignment.getStatus());
    }
}
