package server.olimpo.dto.response;

import java.time.LocalDate;

public record RoutineAssignmentResponse(
        Long id,
        Long routineId,
        String routineName,
        Long clientId,
        String clientName,
        LocalDate assignmentDate,
        String status) {
}
