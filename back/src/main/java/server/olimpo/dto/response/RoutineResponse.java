package server.olimpo.dto.response;

import java.math.BigDecimal;

public record RoutineResponse(
        Long id,
        Long trainerId,
        String trainerName,
        String name,
        String type,
        String description,
        BigDecimal price) {
}
