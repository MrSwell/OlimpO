package server.olimpo.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import server.olimpo.dto.request.LoginRequest;
import server.olimpo.dto.response.AuthenticatedUserResponse;
import server.olimpo.dto.response.LoginResponse;
import server.olimpo.entity.User;
import server.olimpo.repository.UserRepository;
import server.olimpo.security.JwtService;
import server.olimpo.service.AuthService;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private Authentication authentication;

    private AuthService service() {
        return new AuthService(authenticationManager, jwtService, userRepository, 86_400_000L);
    }

    private User adminUser() {
        return User.builder().id(1L).email("admin@olimpo.com").status("ACTIVE").build();
    }

    @Test
    @DisplayName("Login returns token with roles after manager auth")
    void loginSuccess() {
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userRepository.findByEmail("admin@olimpo.com")).thenReturn(Optional.of(adminUser()));
        when(userRepository.findRoleNamesByUserId(1L)).thenReturn(List.of("ADMIN"));
        when(jwtService.generateToken(eq("admin@olimpo.com"), eq(List.of("ADMIN")))).thenReturn("jwt-token");

        LoginResponse response = service().login(new LoginRequest("admin@olimpo.com", "admin123"));

        assertEquals("jwt-token", response.token());
        assertEquals("Bearer", response.tokenType());
        assertEquals(86_400, response.expiresIn());
        assertEquals(List.of("ADMIN"), response.roles());
    }

    @Test
    @DisplayName("Email is trimmed and lowercased before authenticating")
    void loginNormalizesEmail() {
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userRepository.findByEmail("admin@olimpo.com")).thenReturn(Optional.of(adminUser()));
        when(userRepository.findRoleNamesByUserId(1L)).thenReturn(List.of("ADMIN"));
        when(jwtService.generateToken(anyString(), any())).thenReturn("t");

        service().login(new LoginRequest("  Admin@OLIMPO.COM ", "x"));

        ArgumentCaptor<UsernamePasswordAuthenticationToken> captor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(captor.capture());
        assertEquals("admin@olimpo.com", captor.getValue().getPrincipal());
    }

    @Test
    @DisplayName("me() returns email, names and roles for the current principal")
    void meReturnsProfile() {
        User user = User.builder().id(1L).email("admin@olimpo.com")
                .firstName("Ana").lastName("Gomez").status("ACTIVE").build();
        when(authentication.getName()).thenReturn("admin@olimpo.com");
        when(userRepository.findByEmail("admin@olimpo.com")).thenReturn(Optional.of(user));
        when(userRepository.findRoleNamesByUserId(1L)).thenReturn(List.of("ADMIN", "RECEPCIONIST"));

        AuthenticatedUserResponse response = service().me(authentication);

        assertEquals("admin@olimpo.com", response.email());
        assertEquals("Ana", response.firstName());
        assertEquals(List.of("ADMIN", "RECEPCIONIST"), response.roles());
    }

    @Test
    @DisplayName("refresh() issues a new token for the authenticated principal")
    void refreshIssuesToken() {
        when(authentication.getName()).thenReturn("admin@olimpo.com");
        when(userRepository.findByEmail("admin@olimpo.com")).thenReturn(Optional.of(adminUser()));
        when(userRepository.findRoleNamesByUserId(1L)).thenReturn(List.of("ADMIN"));
        when(jwtService.generateToken(anyString(), any())).thenReturn("refreshed");

        LoginResponse response = service().refresh(authentication);

        assertEquals("refreshed", response.token());
    }
}