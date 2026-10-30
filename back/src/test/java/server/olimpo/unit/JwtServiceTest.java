package server.olimpo.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import server.olimpo.security.JwtService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(
            "unit-test-secret-key-with-at-least-32-bytes!", 3_600_000L);

    @Test
    @DisplayName("Generates and parses a valid token (subject = email)")
    void generateAndParseRoundTrip() {
        String token = jwtService.generateToken("admin@olimpo.com", List.of("ADMIN"));

        assertEquals("admin@olimpo.com", jwtService.extractEmail(token));
        assertTrue(jwtService.isValid(token));
    }

    @Test
    @DisplayName("isValid returns false for garbage tokens")
    void garbageTokenIsRejected() {
        assertFalse(jwtService.isValid("not-a-jwt"));
        assertFalse(jwtService.isValid(""));
        assertFalse(jwtService.isValid(null));
    }

    @Test
    @DisplayName("Token signed with another secret is rejected")
    void foreignTokenIsRejected() {
        JwtService other = new JwtService("another-secret-key-different-32bytes!!", 3_600_000L);
        String forged = other.generateToken("admin@olimpo.com", List.of("ADMIN"));

        assertFalse(jwtService.isValid(forged));
    }
}