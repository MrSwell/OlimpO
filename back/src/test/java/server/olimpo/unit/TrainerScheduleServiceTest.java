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
import server.olimpo.dto.request.CreateTrainerScheduleRequest;
import server.olimpo.dto.response.TrainerScheduleResponse;
import server.olimpo.entity.Trainer;
import server.olimpo.entity.TrainerSchedule;
import server.olimpo.entity.User;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.TrainerRepository;
import server.olimpo.repository.TrainerScheduleRepository;
import server.olimpo.repository.UserRepository;
import server.olimpo.service.TrainerScheduleService;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrainerScheduleServiceTest {

    @Mock
    private TrainerScheduleRepository scheduleRepository;
    @Mock
    private TrainerRepository trainerRepository;
    @Mock
    private UserRepository userRepository;

    private TrainerScheduleService service() {
        return new TrainerScheduleService(scheduleRepository, trainerRepository, userRepository);
    }

    private Authentication auth(String email, String... roles) {
        var authorities = Arrays.stream(roles)
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .toList();
        return new UsernamePasswordAuthenticationToken(email, null, authorities);
    }

    private Trainer trainer(long id) {
        return Trainer.builder().id(id).userId(7L).build();
    }

    @Test
    @DisplayName("S5: POST replaces the whole week; dayOfWeek 2 renders as Monday")
    void savesAndReplacesWholeWeek() {
        TrainerSchedule stale = TrainerSchedule.builder().id(1L).trainerId(2L)
                .dayOfWeek(2).startTime(LocalTime.of(22, 0)).endTime(LocalTime.of(23, 0)).build();
        List<TrainerSchedule> oldWeek = List.of(stale);
        when(trainerRepository.findById(2L)).thenReturn(Optional.of(trainer(2L)));
        when(scheduleRepository.findByTrainerIdOrderByDayOfWeekAscStartTimeAsc(2L)).thenReturn(oldWeek);
        when(scheduleRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        var slots = List.of(
                new CreateTrainerScheduleRequest(2, LocalTime.of(6, 0), LocalTime.of(10, 0), null),
                new CreateTrainerScheduleRequest(7, LocalTime.of(8, 0), LocalTime.of(12, 0), "NOT_AVAILABLE"));

        List<TrainerScheduleResponse> response = service().saveWeeklySchedule(2L, slots,
                auth("admin@olimpo.com", "ADMIN"));

        assertEquals(2, response.size());
        assertEquals("Monday", response.get(0).dayName());
        assertEquals(2, response.get(0).dayOfWeek());
        assertEquals("AVAILABLE", response.get(0).status());
        assertEquals("Saturday", response.get(1).dayName());
        assertEquals("NOT_AVAILABLE", response.get(1).status());
        verify(scheduleRepository).deleteAll(oldWeek);
    }

    @Test
    @DisplayName("S5: overlapping slots on the same day -> 409 before touching the DB")
    void overlappingSlotsRejected() {
        when(trainerRepository.findById(2L)).thenReturn(Optional.of(trainer(2L)));

        var overlap = List.of(
                new CreateTrainerScheduleRequest(3, LocalTime.of(8, 0), LocalTime.of(12, 0), null),
                new CreateTrainerScheduleRequest(3, LocalTime.of(10, 0), LocalTime.of(14, 0), null));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service().saveWeeklySchedule(2L, overlap, auth("admin@olimpo.com", "ADMIN")));

        assertTrue(ex.getMessage().contains("Overlapping"));
        verifyNoInteractions(scheduleRepository);
    }

    @Test
    @DisplayName("S5: endTime <= startTime -> 400")
    void invalidTimeRange() {
        when(trainerRepository.findById(2L)).thenReturn(Optional.of(trainer(2L)));

        var badRange = List.of(
                new CreateTrainerScheduleRequest(2, LocalTime.of(18, 0), LocalTime.of(9, 0), null));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().saveWeeklySchedule(2L, badRange, auth("admin@olimpo.com", "ADMIN")));

        assertTrue(ex.getMessage().contains("must be after"));
        verifyNoInteractions(scheduleRepository);
    }

    @Test
    @DisplayName("S5: empty list of slots -> 400")
    void emptySlotsRejected() {
        when(trainerRepository.findById(2L)).thenReturn(Optional.of(trainer(2L)));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().saveWeeklySchedule(2L, List.of(), auth("admin@olimpo.com", "ADMIN")));

        assertTrue(ex.getMessage().contains("At least one"));
    }

    @Test
    @DisplayName("S5: invalid status -> 400 with allowed list")
    void invalidScheduleStatus() {
        when(trainerRepository.findById(2L)).thenReturn(Optional.of(trainer(2L)));

        var badStatus = List.of(
                new CreateTrainerScheduleRequest(2, LocalTime.of(6, 0), LocalTime.of(10, 0), "FERIADO"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().saveWeeklySchedule(2L, badStatus, auth("admin@olimpo.com", "ADMIN")));

        assertTrue(ex.getMessage().contains("AVAILABLE, NOT_AVAILABLE, RESERVED"));
    }

    @Test
    @DisplayName("S5: unknown trainer -> 404")
    void unknownTrainer() {
        when(trainerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().saveWeeklySchedule(99L,
                List.of(new CreateTrainerScheduleRequest(2, LocalTime.of(6, 0), LocalTime.of(10, 0), null)),
                auth("admin@olimpo.com", "ADMIN")));
    }

    @Test
    @DisplayName("S5: TRAINER managing another trainer's schedule -> 403 with hint message")
    void trainerCannotManageOthers() {
        when(userRepository.findByEmail("trainer2@olimpo.com"))
                .thenReturn(Optional.of(User.builder().id(5L).email("trainer2@olimpo.com").build()));
        when(trainerRepository.findByUserId(5L)).thenReturn(Optional.of(trainer(1L)));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> service().getWeeklySchedule(2L, auth("trainer2@olimpo.com", "TRAINER")));

        assertTrue(ex.getMessage().contains("their own schedule"));
        verifyNoInteractions(scheduleRepository);
    }

    @Test
    @DisplayName("S5: TRAINER reading its own schedule works")
    void trainerReadsOwnSchedule() {
        when(userRepository.findByEmail("trainer2@olimpo.com"))
                .thenReturn(Optional.of(User.builder().id(5L).email("trainer2@olimpo.com").build()));
        when(trainerRepository.findByUserId(5L)).thenReturn(Optional.of(trainer(1L)));
        when(trainerRepository.findById(1L)).thenReturn(Optional.of(trainer(1L)));
        when(scheduleRepository.findByTrainerIdOrderByDayOfWeekAscStartTimeAsc(1L)).thenReturn(List.of(
                TrainerSchedule.builder().id(5L).trainerId(1L).dayOfWeek(2)
                        .startTime(LocalTime.of(6, 0)).endTime(LocalTime.of(10, 0)).build()));

        List<TrainerScheduleResponse> week = service().getWeeklySchedule(1L,
                auth("trainer2@olimpo.com", "TRAINER"));

        assertEquals(1, week.size());
        assertEquals("Monday", week.get(0).dayName());
    }

    @Test
    @DisplayName("S5: CLIENT and RECEPCIONIST cannot access schedules -> 403")
    void otherRolesDenied() {
        assertThrows(AccessDeniedException.class,
                () -> service().getWeeklySchedule(1L, auth("cliente1@olimpo.com", "CLIENT")));
        assertThrows(AccessDeniedException.class,
                () -> service().getWeeklySchedule(1L, auth("recepcionista@olimpo.com", "RECEPCIONIST")));
        verifyNoInteractions(scheduleRepository, trainerRepository, userRepository);
    }

    @Test
    @DisplayName("S5: TRAINER_MANAGER can manage any trainer's schedule")
    void managerHasFullAccess() {
        when(trainerRepository.findById(2L)).thenReturn(Optional.of(trainer(2L)));
        when(scheduleRepository.findByTrainerIdOrderByDayOfWeekAscStartTimeAsc(2L)).thenReturn(List.of());

        List<TrainerScheduleResponse> week = service().getWeeklySchedule(2L,
                auth("trainer@olimpo.com", "TRAINER", "TRAINER_MANAGER"));

        assertTrue(week.isEmpty());
    }
}