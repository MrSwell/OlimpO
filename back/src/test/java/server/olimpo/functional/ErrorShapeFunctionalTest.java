package server.olimpo.functional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Phase 2 - Module G: every error must be the same safe JSON, never internals. */
class ErrorShapeFunctionalTest extends BaseFunctionalTest {

    @Test
    @DisplayName("G1: unauthenticated request -> 401 {status, error, message}")
    void unauthenticated() {
        Response response = get("/users", null);
        assertError(response, 401, "Unauthorized");
    }

    @Test
    @DisplayName("G2: unknown endpoint -> 404 Resource not found")
    void unknownEndpoint() {
        Response response = get("/nonexistent-endpoint", adminToken());
        assertError(response, 404, "Not Found");
        assertEquals("Resource not found", str(response, "$.message"));
    }

    @Test
    @DisplayName("G3: unsupported method -> 405 Method Not Allowed")
    void methodNotAllowed() {
        Response response = put("/users", adminToken(), "{}");
        assertError(response, 405, "Method Not Allowed");
    }

    @Test
    @DisplayName("G4: non-numeric path id -> 400 Invalid request parameter: id")
    void typeMismatch() {
        Response response = get("/users/abc", adminToken());
        assertError(response, 400, "Bad Request");
        assertEquals("Invalid request parameter: id", str(response, "$.message"));
    }

    @Test
    @DisplayName("G5: malformed JSON -> 400 without parser details")
    void malformedJson() {
        Response response = post("/users", adminToken(), "{\"email\":}");
        assertError(response, 400, "Bad Request");
        assertEquals("Malformed or unreadable JSON request body", str(response, "$.message"));
    }

    @Test
    @DisplayName("G6: bean validation failure -> 400 joining field messages")
    void validationMessages() {
        Response response = post("/users", adminToken(), "{\"email\":\"bad\"}");

        assertError(response, 400, "Bad Request");
        String message = str(response, "$.message");
        assertTrue(message.contains("email") || message.contains("Email"), "email field reported: " + message);
        assertTrue(message.contains("password") || message.contains("Password"),
                "password field reported: " + message);
    }

    @Test
    @DisplayName("G7: error bodies never contain SQL, classes or hash fields")
    void noInternalsInErrorBodies() {
        Response wrongPassword = post("/auth/login", null,
                "{\"email\":\"admin@olimpo.com\",\"password\":\"mala\"}");
        Response notFound = get("/routines/999999", adminToken());

        for (Response response : new Response[]{wrongPassword, notFound}) {
            String raw = response.body();
            assertTrue(!raw.contains("SELECT") && !raw.contains("select *"), "SQL leaked: " + raw);
            assertTrue(!raw.contains("server.olimpo."), "internal FQCN leaked: " + raw);
            assertTrue(!raw.contains("passwordHash"), "hash field leaked: " + raw);
            assertTrue(!raw.contains("Exception"), "exception class leaked: " + raw);
        }
    }
}