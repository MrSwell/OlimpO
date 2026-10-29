package server.olimpo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import server.olimpo.dto.request.CreateTrainerScheduleRequest;
import server.olimpo.dto.response.TrainerScheduleResponse;
import server.olimpo.service.TrainerScheduleService;

import java.util.List;

/**
 * Weekly trainer schedules (malla horaria).
 * ADMIN and TRAINER_MANAGER manage any trainer's schedule; a TRAINER only its own.
 */
@RestController
@RequestMapping("/api/v1/trainers/{trainerId}/schedules")
public class TrainerScheduleController {

    private final TrainerScheduleService trainerScheduleService;

    public TrainerScheduleController(TrainerScheduleService trainerScheduleService) {
        this.trainerScheduleService = trainerScheduleService;
    }

    @GetMapping
    public List<TrainerScheduleResponse> getWeeklySchedule(@PathVariable Long trainerId) {
        return trainerScheduleService.getWeeklySchedule(trainerId,
                org.springframework.security.core.context.SecurityContextHolder
                        .getContext().getAuthentication());
    }

    /** Replaces the trainer's whole weekly schedule (malla semanal completa). */
    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public List<TrainerScheduleResponse> saveWeeklySchedule(@PathVariable Long trainerId,
                                                            @Valid @RequestBody List<CreateTrainerScheduleRequest> slots) {
        return trainerScheduleService.saveWeeklySchedule(trainerId, slots,
                org.springframework.security.core.context.SecurityContextHolder
                        .getContext().getAuthentication());
    }
}
