package server.olimpo.functional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Phase 2 - Module A (docs/POSTMAN.md): login, me, refresh over real HTTP. */
class AuthFunctionalTest extends BaseFunctionalTest {

    @Test
    @DisplayName("A1: admin login returns 200 with token, Bearer type, roles and expiry")
    void adminLogin() {
        Response response = post("/auth/login", null,
                "{\"email\":\"admin@olimpo.com\",\"password\":\"admin123\"}");

        assertStatus(response, 200);
        String token = str(response, "$.token");
        assertTrue(token != null && token.length() > 20, "token must be a real JWT");
        assertEquals("Bearer", str(response, "$.tokenType"));
        assertTrue(((List<?>) at(response, "$.roles")).contains("ADMIN"));
        assertTrue(((Number) at(response, "$.expiresIn")).longValue() > 0);
    }

    @Test
    @DisplayName("A2: wrong password -> 401 Invalid email or password, generic on purpose")
    void wrongPassword() {
        Response response = post("/auth/login", null,
                "{\"email\":\"admin@olimpo.com\",\"password\":\"equivocada\"}");

        assertError(response, 401, "Unauthorized");
        assertEquals("Invalid email or password", str(response, "$.message"));
    }

    @Test
    @DisplayName("A3: GET /auth/me with token returns profile + roles")
    void meWithToken() {
        Response response = get("/auth/me", adminToken());

        assertStatus(response, 200);
        assertEquals("admin@olimpo.com", str(response, "$.email"));
        assertTrue(((List<?>) at(response, "$.roles")).contains("ADMIN"));
    }

    @Test
    @DisplayName("A4: GET /auth/me without token -> 401 with unified JSON (entry point)")
    void meWithoutToken() {
        Response response = get("/auth/me", null);

        assertError(response, 401, "Unauthorized");
        assertEquals("Authentication required or token invalid", str(response, "$.message"));
    }

    @Test
    @DisplayName("A5: POST /auth/refresh issues a fresh token for the same identity")
    void refreshToken() {
        Response response = post("/auth/refresh", adminToken(), null);

        assertStatus(response, 200);
        assertTrue(str(response, "$.token").length() > 20);
        assertEquals("Bearer", str(response, "$.tokenType"));
    }

    @Test
    @DisplayName("A6: login normalizes the email to lowercase")
    void loginNormalizesEmail() {
        Response response = post("/auth/login", null,
                "{\"email\":\"Admin@OLIMPO.COM\",\"password\":\"admin123\"}");

        assertStatus(response, 200);
        assertEquals("admin@olimpo.com", str(response, "$.email"));
    }

    @Test
    @DisplayName("A7: garbage token on a protected route -> 401, never 500")
    void garbageToken() {
        Response response = get("/auth/me", "no.es.un.jwt");

        assertError(response, 401, "Unauthorized");
    }
}