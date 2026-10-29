package server.olimpo.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phone,
        String status,
        List<String> roles,
        LocalDateTime createdAt) {
}
