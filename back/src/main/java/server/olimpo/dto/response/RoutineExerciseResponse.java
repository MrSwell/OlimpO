package server.olimpo.dto.response;

public record RoutineExerciseResponse(
        Long id,
        String name,
        Integer sets,
        String reps,
        Integer restSeconds,
        String notes) {
}
