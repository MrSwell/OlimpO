package server.olimpo.dto.response;

import java.util.List;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresIn,
        String email,
        List<String> roles) {
}
