package server.olimpo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateRoutineRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 150, message = "Name cannot exceed 150 characters")
        String name,

        @NotBlank(message = "Type is required")
        String type,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        String description,

        /** Only for CUSTOM routines. */
        BigDecimal price,

        /** Only used for CUSTOM routines created by ADMIN/TRAINER_MANAGER. */
        Long trainerId) {
}
