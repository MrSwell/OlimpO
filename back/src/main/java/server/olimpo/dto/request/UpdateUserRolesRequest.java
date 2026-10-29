package server.olimpo.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpdateUserRolesRequest(
        @NotEmpty(message = "At least one role is required")
        List<String> roles) {
}
