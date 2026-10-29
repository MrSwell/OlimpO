package server.olimpo.dto.response;

import java.time.LocalTime;

public record TrainerScheduleResponse(
        Long id,
        Long trainerId,
        Integer dayOfWeek,
        String dayName,
        LocalTime startTime,
        LocalTime endTime,
        String status) {
}
