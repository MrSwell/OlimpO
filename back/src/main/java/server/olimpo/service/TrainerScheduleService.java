package server.olimpo.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.dto.request.CreateTrainerScheduleRequest;
import server.olimpo.dto.response.TrainerScheduleResponse;
import server.olimpo.entity.Trainer;
import server.olimpo.entity.TrainerSchedule;
import server.olimpo.enums.TrainerScheduleStatus;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.TrainerRepository;
import server.olimpo.repository.TrainerScheduleRepository;
import server.olimpo.repository.UserRepository;
import server.olimpo.entity.User;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TrainerScheduleService {

    private final TrainerScheduleRepository scheduleRepository;
    private final TrainerRepository trainerRepository;
    private final UserRepository userRepository;

    public TrainerScheduleService(TrainerScheduleRepository scheduleRepository,
                                  TrainerRepository trainerRepository,
                                  UserRepository userRepository) {
        this.scheduleRepository = scheduleRepository;
        this.trainerRepository = trainerRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TrainerScheduleResponse> getWeeklySchedule(Long trainerId, Authentication authentication) {
        assertCanManageSchedules(trainerId, authentication);
        getTrainerProfile(trainerId);
        return scheduleRepository.findByTrainerIdOrderByDayOfWeekAscStartTimeAsc(trainerId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Replaces the whole weekly schedule of a trainer with the provided slots. */
    @Transactional
    public List<TrainerScheduleResponse> saveWeeklySchedule(Long trainerId,
                                                            List<CreateTrainerScheduleRequest> slots,
                                                            Authentication authentication) {
        assertCanManageSchedules(trainerId, authentication);
        // Pessimistic lock on the trainer row: concurrent replaces of the same week
        // serialize here, so neither one can delete rows the other already removed.
        getTrainerProfileForUpdate(trainerId);

        if (slots == null || slots.isEmpty()) {
            throw new IllegalArgumentException("At least one schedule slot is required");
        }

        List<TrainerSchedule> entities = new ArrayList<>();
        for (CreateTrainerScheduleRequest slot : slots) {
            validateSlot(slot);
            String status = slot.status() == null
                    ? TrainerScheduleStatus.AVAILABLE.name()
                    : validateStatus(slot.status());
            entities.add(TrainerSchedule.builder()
                    .trainerId(trainerId)
                    .dayOfWeek(slot.dayOfWeek())
                    .startTime(slot.startTime())
                    .endTime(slot.endTime())
                    .status(status)
                    .build());
        }

        assertNoOverlaps(trainerId, entities);

        scheduleRepository.deleteAll(scheduleRepository.findByTrainerIdOrderByDayOfWeekAscStartTimeAsc(trainerId));
        return scheduleRepository.saveAll(entities).stream()
                .map(this::toResponse)
                .toList();
    }

    /** ADMIN and TRAINER_MANAGER manage any schedule; TRAINER only its own. */
    public void assertCanManageSchedules(Long trainerId, Authentication authentication) {
        if (hasRole(authentication, "ROLE_ADMIN") || hasRole(authentication, "ROLE_TRAINER_MANAGER")) {
            return;
        }
        if (!hasRole(authentication, "ROLE_TRAINER")) {
            throw new AccessDeniedException("Access denied");
        }
        Trainer ownTrainer = resolveOwnTrainerProfile(authentication);
        if (!ownTrainer.getId().equals(trainerId)) {
            throw new AccessDeniedException("Trainers can only manage their own schedule");
        }
    }

    public Trainer resolveOwnTrainerProfile(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authentication.getName()));
        return trainerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No trainer profile found for this user"));
    }

    private void assertNoOverlaps(Long trainerId, List<TrainerSchedule> newSlots) {
        List<TrainerSchedule> all = new ArrayList<>(newSlots);
        // Merge with existing future slots is not needed: the weekly schedule is replaced as a whole.
        Map<Integer, List<TrainerSchedule>> byDay = all.stream()
                .collect(Collectors.groupingBy(TrainerSchedule::getDayOfWeek));

        for (Map.Entry<Integer, List<TrainerSchedule>> entry : byDay.entrySet()) {
            List<TrainerSchedule> sorted = entry.getValue().stream()
                    .sorted(Comparator.comparing(TrainerSchedule::getStartTime))
                    .toList();
            for (int i = 1; i < sorted.size(); i++) {
                LocalTime previousEnd = sorted.get(i - 1).getEndTime();
                LocalTime currentStart = sorted.get(i).getStartTime();
                if (!currentStart.isAfter(previousEnd)) {
                    throw new BusinessException("Overlapping slots on day " + entry.getKey()
                            + " between " + sorted.get(i - 1).getStartTime() + "-" + previousEnd
                            + " and " + currentStart + "-" + sorted.get(i).getEndTime());
                }
            }
        }
    }

    private void validateSlot(CreateTrainerScheduleRequest slot) {
        if (!slot.endTime().isAfter(slot.startTime())) {
            throw new IllegalArgumentException(
                    "EndTime must be after StartTime for day " + slot.dayOfWeek());
        }
    }

    private String validateStatus(String status) {
        try {
            return TrainerScheduleStatus.valueOf(status.trim().toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid schedule status: " + status + ". Allowed: AVAILABLE, NOT_AVAILABLE, RESERVED");
        }
    }

    private Trainer getTrainerProfile(Long trainerId) {
        return trainerRepository.findById(trainerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainer not found with id: " + trainerId));
    }

    private Trainer getTrainerProfileForUpdate(Long trainerId) {
        return trainerRepository.findByIdForUpdate(trainerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainer not found with id: " + trainerId));
    }

    private boolean hasRole(Authentication authentication, String authority) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(authority));
    }

    private TrainerScheduleResponse toResponse(TrainerSchedule schedule) {
        // day_of_week stores MySQL DAYOFWEEK convention (1 = Sunday ... 7 = Saturday);
        // java.time DayOfWeek is Monday=1 ... Sunday=7.
        DayOfWeek dayOfWeek = DayOfWeek.of((schedule.getDayOfWeek() + 5) % 7 + 1);
        String dayName = dayOfWeek.getDisplayName(
                java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH);
        return new TrainerScheduleResponse(schedule.getId(), schedule.getTrainerId(),
                schedule.getDayOfWeek(), dayName, schedule.getStartTime(), schedule.getEndTime(), schedule.getStatus());
    }
}
