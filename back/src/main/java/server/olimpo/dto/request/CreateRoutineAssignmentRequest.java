package server.olimpo.dto.request;

import jakarta.validation.constraints.NotNull;

public record CreateRoutineAssignmentRequest(
        @NotNull(message = "ClientId is required")
        Long clientId,

        /** Optional: ACTIVE by default. */
        String status) {
}
