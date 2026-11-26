package server.olimpo.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoutineExerciseRequest(
        @NotBlank(message = "Exercise name is required")
        @Size(max = 150, message = "Exercise name cannot exceed 150 characters")
        String name,

        @Min(value = 1, message = "Sets must be at least 1")
        @Max(value = 20, message = "Sets cannot exceed 20")
        Integer sets,

        @Size(max = 50, message = "Reps cannot exceed 50 characters")
        String reps,

        @Min(value = 0, message = "Rest cannot be negative")
        @Max(value = 600, message = "Rest cannot exceed 600 seconds")
        Integer restSeconds,

        @Size(max = 255, message = "Notes cannot exceed 255 characters")
        String notes) {
}
