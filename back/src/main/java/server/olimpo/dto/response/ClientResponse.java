package server.olimpo.dto.response;

import java.time.LocalDate;

public record ClientResponse(
        Long id,
        Long userId,
        String email,
        String firstName,
        String lastName,
        String phone,
        String documentNumber,
        LocalDate birthDate,
        String sex,
        String fitnessGoal,
        String status) {
}
