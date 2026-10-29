package server.olimpo.dto.response;

import java.util.List;

public record AuthenticatedUserResponse(
        String email,
        String firstName,
        String lastName,
        List<String> roles) {
}
