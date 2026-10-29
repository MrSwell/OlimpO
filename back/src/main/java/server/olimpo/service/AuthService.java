package server.olimpo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import server.olimpo.dto.request.LoginRequest;
import server.olimpo.dto.response.AuthenticatedUserResponse;
import server.olimpo.dto.response.LoginResponse;
import server.olimpo.entity.User;
import server.olimpo.repository.UserRepository;
import server.olimpo.security.JwtService;

import java.util.List;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final long expirationMs;

public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       UserRepository userRepository,
                       @Value("${jwt.expiration-ms}") long expirationMs) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.expirationMs = expirationMs;
    }

    public LoginResponse login(LoginRequest request) {
        // Normalize before authenticating: users are always stored in lowercase.
        String email = request.email().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        List<String> roles = userRepository.findRoleNamesByUserId(user.getId());
        return buildResponse(user.getEmail(), roles);
    }

    public LoginResponse refresh(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        List<String> roles = userRepository.findRoleNamesByUserId(user.getId());
        return buildResponse(user.getEmail(), roles);
    }

    public AuthenticatedUserResponse me(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        List<String> roles = userRepository.findRoleNamesByUserId(user.getId());
        return new AuthenticatedUserResponse(user.getEmail(), user.getFirstName(), user.getLastName(), roles);
    }

    private LoginResponse buildResponse(String email, List<String> roles) {
        String token = jwtService.generateToken(email, roles);
        return new LoginResponse(token, "Bearer", expirationMs / 1000, email, roles);
    }
}
