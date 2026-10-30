package server.olimpo.volume;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Phase 3 - authentication under load: many concurrent logins, authorized calls
 * with the issued tokens, a burst of bad credentials, parallel refreshes and a
 * burst of unauthenticated requests.
 *
 * Every round asserts the API never answers a 5xx: under load it must degrade with
 * the unified 4xx JSON, never with a server error.
 */
class LoginLoadTest extends BaseVolumeTest {

    private static final String[][] ACCOUNTS = {
            {"admin@olimpo.com", "admin123"},
            {"recepcionista@olimpo.com", "recep123"},
            {"trainer@olimpo.com", "trainer123"},
            {"trainer2@olimpo.com", "trainer123"},
            {"cliente1@olimpo.com", "cliente123"},
    };

    private Response loginCall(String email, String password) {
        return post("/auth/login", null,
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}");
    }

    @Test
    @DisplayName("V1: 160 concurrent logins in rounds of 32, tokens usable on /auth/me")
    void concurrentLogins() {
        List<String> tokens = new ArrayList<>();
        for (int round = 0; round < 5; round++) {           // 5 rounds x 32 = 160 logins
            AtomicInteger pick = new AtomicInteger();
            List<Response> responses = runParallel(32, () -> {
                String[] account = ACCOUNTS[pick.getAndIncrement() % ACCOUNTS.length];
                return loginCall(account[0], account[1]);
            });
            assertNo5xx(responses);
            assertAllStatus(responses, 200);
            responses.forEach(r -> tokens.add(str(r, "$.token")));
        }
        assertEquals(160, tokens.size());

        // A sample of the issued tokens must authenticate a protected call, in parallel.
        List<String> usable = List.copyOf(tokens.subList(0, 40));
        AtomicInteger mePick = new AtomicInteger();
        List<Response> me = runParallel(40, () ->
                get("/auth/me", usable.get(mePick.getAndIncrement() % usable.size())));
        assertNo5xx(me);
        assertAllStatus(me, 200);
    }

    @Test
    @DisplayName("V2: burst of 60 bad-credential logins -> all 401 with the same generic message")
    void badCredentialsBurst() {
        AtomicInteger n = new AtomicInteger();
        List<Response> responses = runParallel(60, () ->
                loginCall("admin@olimpo.com", "clave-mala-" + n.getAndIncrement()));

        assertNo5xx(responses);
        assertAllStatus(responses, 401);
        responses.forEach(r -> assertEquals("Invalid email or password", str(r, "$.message")));
    }

    @Test
    @DisplayName("V3: 36 parallel /auth/refresh with valid tokens -> all 200 with a new token")
    void parallelRefresh() {
        List<String> tokens = new ArrayList<>();
        for (int i = 0; i < 36; i++) {
            String[] account = ACCOUNTS[i % ACCOUNTS.length];
            Response login = loginCall(account[0], account[1]);
            assertStatus(login, 200);
            tokens.add(str(login, "$.token"));
        }

        List<String> usable = tokens;
        AtomicInteger pick = new AtomicInteger();
        List<Response> refreshes = runParallel(36,
                () -> post("/auth/refresh", usable.get(pick.getAndIncrement() % usable.size()), null));

        assertNo5xx(refreshes);
        assertAllStatus(refreshes, 200);
        refreshes.forEach(r -> assertTrue(str(r, "$.token").length() > 20,
                "refresh must return a real JWT"));
    }

    @Test
    @DisplayName("V4: 40 parallel unauthenticated /auth/me -> all 401 with unified JSON")
    void unauthenticatedBurst() {
        List<Response> responses = runParallel(40, () -> get("/auth/me", null));

        assertNo5xx(responses);
        assertAllStatus(responses, 401);
        responses.forEach(r -> assertEquals("Authentication required or token invalid",
                str(r, "$.message")));
    }
}