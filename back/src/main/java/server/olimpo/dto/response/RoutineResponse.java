package server.olimpo.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record RoutineResponse(
        Long id,
        Long trainerId,
        String trainerName,
        String name,
        String type,
        String description,
        BigDecimal price,
        List<RoutineExerciseResponse> exercises) {
}
