package server.olimpo.controller;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import server.olimpo.dto.request.LoginRequest;
import server.olimpo.dto.response.AuthenticatedUserResponse;
import server.olimpo.dto.response.LoginResponse;
import server.olimpo.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public LoginResponse refresh(Authentication authentication) {
        return authService.refresh(authentication);
    }

    @GetMapping("/me")
    public AuthenticatedUserResponse me(Authentication authentication) {
        return authService.me(authentication);
    }
}
