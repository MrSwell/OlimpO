package server.olimpo.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

/**
 * One weekly slot. dayOfWeek: 1 = Sunday ... 7 = Saturday (MySQL DAYOFWEEK convention).
 */
public record CreateTrainerScheduleRequest(
        @NotNull(message = "DayOfWeek is required")
        @Min(value = 1, message = "DayOfWeek must be between 1 (Sunday) and 7 (Saturday)")
        @Max(value = 7, message = "DayOfWeek must be between 1 (Sunday) and 7 (Saturday)")
        Integer dayOfWeek,

        @NotNull(message = "StartTime is required")
        LocalTime startTime,

        @NotNull(message = "EndTime is required")
        LocalTime endTime,

        String status) {
}
