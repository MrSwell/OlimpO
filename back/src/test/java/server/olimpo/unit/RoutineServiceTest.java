package server.olimpo.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import server.olimpo.dto.request.CreateRoutineAssignmentRequest;
import server.olimpo.dto.request.CreateRoutineRequest;
import server.olimpo.dto.response.RoutineAssignmentResponse;
import server.olimpo.dto.response.RoutineResponse;
import server.olimpo.entity.Client;
import server.olimpo.entity.Routine;
import server.olimpo.entity.RoutineAssignment;
import server.olimpo.entity.Trainer;
import server.olimpo.entity.User;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.ClientRepository;
import server.olimpo.repository.RoutineAssignmentRepository;
import server.olimpo.repository.RoutineRepository;
import server.olimpo.repository.TrainerRepository;
import server.olimpo.repository.UserRepository;
import server.olimpo.service.RoutineService;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoutineServiceTest {

    @Mock
    private RoutineRepository routineRepository;
    @Mock
    private RoutineAssignmentRepository assignmentRepository;
    @Mock
    private TrainerRepository trainerRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private UserRepository userRepository;

    private RoutineService service() {
        return new RoutineService(routineRepository, assignmentRepository,
                trainerRepository, clientRepository, userRepository);
    }

    private Authentication auth(String email, String... roles) {
        var authorities = Arrays.stream(roles)
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .toList();
        return new UsernamePasswordAuthenticationToken(email, null, authorities);
    }

    private CreateRoutineRequest routine(String name, String type, BigDecimal price, Long trainerId) {
        return new CreateRoutineRequest(name, type, "Plan de prueba", price, trainerId);
    }

    @Test
    @DisplayName("S6: GENERAL routine stores neither trainer nor price")
    void createGeneralRoutine() {
        when(routineRepository.save(any(Routine.class))).thenAnswer(inv -> {
            Routine r = inv.getArgument(0);
            r.setId(10L);
            return r;
        });

        RoutineResponse response = service().createRoutine(
                routine("Full body general", "GENERAL", null, null),
                auth("admin@olimpo.com", "ADMIN"));

        assertEquals(10L, response.id());
        assertEquals("GENERAL", response.type());
        assertNull(response.trainerId());
        assertNull(response.trainerName());
        assertNull(response.price());
    }

    @Test
    @DisplayName("S6: GENERAL with price -> 400")
    void generalWithPriceRejected() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().createRoutine(routine("Plan X", "GENERAL", new BigDecimal("50"), null),
                        auth("admin@olimpo.com", "ADMIN")));
        assertTrue(ex.getMessage().contains("only allowed for CUSTOM"));
        verifyNoInteractions(routineRepository);
    }

    @Test
    @DisplayName("S6: CUSTOM without price -> 400")
    void customWithoutPriceRejected() {
        when(trainerRepository.findById(2L)).thenReturn(Optional.of(Trainer.builder().id(2L).userId(7L).build()));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().createRoutine(routine("Plan A", "CUSTOM", null, 2L),
                        auth("admin@olimpo.com", "ADMIN")));

        assertTrue(ex.getMessage().contains("price greater than 0"));
        verifyNoInteractions(routineRepository);
    }

    @Test
    @DisplayName("S6: ADMIN assigns an explicit trainerId to a CUSTOM routine and gets its name")
    void adminCreatesCustomWithExplicitTrainer() {
        when(trainerRepository.findById(2L)).thenReturn(Optional.of(Trainer.builder().id(2L).userId(7L).build()));
        when(userRepository.findById(7L)).thenReturn(Optional.of(
                User.builder().id(7L).firstName("Carla").lastName("Ruiz").build()));
        when(routineRepository.save(any(Routine.class))).thenAnswer(inv -> {
            Routine r = inv.getArgument(0);
            r.setId(11L);
            return r;
        });

        RoutineResponse response = service().createRoutine(
                routine("Plan A", "CUSTOM", new BigDecimal("80.00"), 2L),
                auth("admin@olimpo.com", "ADMIN"));

        assertEquals(2L, response.trainerId());
        assertEquals("Carla Ruiz", response.trainerName());
        assertEquals(0, new BigDecimal("80.00").compareTo(response.price()));
    }

    @Test
    @DisplayName("S6: TRAINER creating CUSTOM always uses its own profile, ignoring request trainerId")
    void trainerUsesOwnProfile() {
        when(userRepository.findByEmail("trainer@olimpo.com"))
                .thenReturn(Optional.of(User.builder().id(6L).email("trainer@olimpo.com").build()));
        when(trainerRepository.findByUserId(6L)).thenReturn(Optional.of(
                Trainer.builder().id(2L).userId(6L).build()));
        when(trainerRepository.findById(2L)).thenReturn(Optional.of(
                Trainer.builder().id(2L).userId(6L).build()));
        when(userRepository.findById(6L)).thenReturn(Optional.of(
                User.builder().id(6L).firstName("Diego").lastName("Sanchez").build()));
        when(routineRepository.save(any(Routine.class))).thenAnswer(inv -> {
            Routine r = inv.getArgument(0);
            r.setId(12L);
            return r;
        });

        RoutineResponse response = service().createRoutine(
                routine("Plan propio", "CUSTOM", new BigDecimal("90"), 1L),
                auth("trainer@olimpo.com", "TRAINER"));

        assertEquals(2L, response.trainerId());
        assertEquals("Diego Sanchez", response.trainerName());
    }

    @Test
    @DisplayName("S6: TRAINER without trainer profile -> 404")
    void trainerWithoutProfile() {
        when(userRepository.findByEmail("trainer@olimpo.com"))
                .thenReturn(Optional.of(User.builder().id(6L).email("trainer@olimpo.com").build()));
        when(trainerRepository.findByUserId(6L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().createRoutine(
                routine("Plan", "CUSTOM", new BigDecimal("90"), null),
                auth("trainer@olimpo.com", "TRAINER")));
    }

    @Test
    @DisplayName("S6: invalid type -> 400 with allowed list")
    void invalidType() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().createRoutine(routine("Plan Z", "PREMIUM", null, null),
                        auth("admin@olimpo.com", "ADMIN")));
        assertTrue(ex.getMessage().contains("GENERAL, CUSTOM"));
        verifyNoInteractions(routineRepository);
    }

    @Test
    @DisplayName("S6: CLIENT cannot create routines -> 403")
    void clientDenied() {
        assertThrows(AccessDeniedException.class, () -> service().createRoutine(
                routine("Plan", "GENERAL", null, null), auth("cliente1@olimpo.com", "CLIENT")));
        verifyNoInteractions(routineRepository, trainerRepository, userRepository);
    }

    @Test
    @DisplayName("S6: assigning a routine to a client defaults to ACTIVE with today's date")
    void assignRoutineSuccess() {
        Routine routine = Routine.builder().id(3L).name("Plan A").type("CUSTOM").build();
        Client client = Client.builder().id(1L).userId(5L).build();
        User user = User.builder().id(5L).firstName("Luis").lastName("Perez").build();
        when(routineRepository.findById(3L)).thenReturn(Optional.of(routine));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(assignmentRepository.save(any(RoutineAssignment.class))).thenAnswer(inv -> {
            RoutineAssignment a = inv.getArgument(0);
            a.setId(70L);
            return a;
        });
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        RoutineAssignmentResponse response = service().assignRoutine(3L,
                new CreateRoutineAssignmentRequest(1L, null),
                auth("admin@olimpo.com", "ADMIN"));

        assertEquals(70L, response.id());
        assertEquals("Plan A", response.routineName());
        assertEquals("Luis Perez", response.clientName());
        assertEquals("ACTIVE", response.status());
        assertEquals(java.time.LocalDate.now(), response.assignmentDate());
    }

    @Test
    @DisplayName("S6: assigning to unknown client -> 404")
    void assignUnknownClient() {
        when(routineRepository.findById(3L)).thenReturn(Optional.of(
                Routine.builder().id(3L).name("Plan A").build()));
        when(clientRepository.findById(9999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().assignRoutine(3L,
                new CreateRoutineAssignmentRequest(9999L, null), auth("admin@olimpo.com", "ADMIN")));
        verifyNoInteractions(assignmentRepository);
    }

    @Test
    @DisplayName("S6: assigning unknown routine -> 404")
    void assignUnknownRoutine() {
        when(routineRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().assignRoutine(99L,
                new CreateRoutineAssignmentRequest(1L, null), auth("admin@olimpo.com", "ADMIN")));
    }

    @Test
    @DisplayName("S6: invalid assignment status -> 400 with allowed list")
    void invalidAssignmentStatus() {
        when(routineRepository.findById(3L)).thenReturn(Optional.of(
                Routine.builder().id(3L).name("Plan A").build()));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(Client.builder().id(1L).build()));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().assignRoutine(3L, new CreateRoutineAssignmentRequest(1L, "FINALIZADA"),
                        auth("admin@olimpo.com", "ADMIN")));

        assertTrue(ex.getMessage().contains("ACTIVE, COMPLETED, CANCELLED"));
        verifyNoInteractions(assignmentRepository);
    }

    @Test
    @DisplayName("S6: unknown routine on GET -> 404")
    void getRoutineUnknown() {
        when(routineRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().getRoutineById(99L));
    }
}