package server.olimpo.functional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Phase 2 - Module B: user management and the role matrix. Cleanup is automatic (FUNC prefix). */
class UserFunctionalTest extends BaseFunctionalTest {

    @Test
    @DisplayName("B1: ADMIN creates a RECEPCIONIST -> 201 without password hash")
    void createReceptionist() {
        Response response = post("/users", adminToken(), accountBody(uniqueEmail(), "Laura"));

        assertStatus(response, 201);
        assertTrue(str(response, "$.id") != null);
        assertTrue(((List<?>) at(response, "$.roles")).contains("RECEPCIONIST"));
        assertFalse(response.body().contains("passwordHash"));
        assertFalse(response.body().contains("func1234"), "plain password must never be echoed");
    }

    @Test
    @DisplayName("B2: duplicate email -> 409 Conflict with the unified shape")
    void duplicateEmail() {
        String email = uniqueEmail();
        post("/users", adminToken(), accountBody(email, "Laura"));
        Response second = post("/users", adminToken(), accountBody(email, "Laura"));

        assertError(second, 409, "Conflict");
        assertTrue(str(second, "$.message").contains("already exists"));
    }

    @Test
    @DisplayName("B3: assigning CLIENT via user management -> 400")
    void clientRoleForbidden() {
        String body = accountBody(uniqueEmail(), "Ana").replace("RECEPCIONIST", "CLIENT");
        Response response = post("/users", adminToken(), body);

        assertError(response, 400, "Bad Request");
        assertTrue(str(response, "$.message").contains("CLIENT cannot be assigned"));
    }

    @Test
    @DisplayName("B4: unknown role -> 400 Invalid role")
    void invalidRole() {
        String body = accountBody(uniqueEmail(), "Ana").replace("RECEPCIONIST", "COACH");
        Response response = post("/users", adminToken(), body);

        assertError(response, 400, "Bad Request");
        assertTrue(str(response, "$.message").contains("Invalid role"));
    }

    @Test
    @DisplayName("B5: ADMIN lists users -> 200 paged content")
    void listAsAdmin() {
        Response response = get("/users", adminToken());

        assertStatus(response, 200);
        assertTrue(at(response, "$.content") instanceof List<?> content && !content.isEmpty(),
                "seeded users must be listed");
    }

    @Test
    @DisplayName("B6: RECEPCIONIST listing users -> 403")
    void listAsReceptionistForbidden() {
        Response response = get("/users", recepToken());
        assertError(response, 403, "Forbidden");
    }

    @Test
    @DisplayName("B7: ADMIN replaces roles (RECEPCIONIST -> TRAINER) -> 200")
    void replaceRoles() {
        String email = uniqueEmail();
        Response created = post("/users", adminToken(), accountBody(email, "Marcos"));
        long id = ((Number) at(created, "$.id")).longValue();

        Response patched = patch("/users/" + id + "/roles", adminToken(), "{\"roles\":[\"TRAINER\"]}");

        assertStatus(patched, 200);
        assertEqualsRoles(patched, "TRAINER");
        assertFalse(patched.body().contains("RECEPCIONIST"), "old roles must be replaced");
    }

    @Test
    @DisplayName("B8: RECEPCIONIST cannot patch roles -> 403")
    void patchRolesForbidden() {
        Response response = patch("/users/1/roles", recepToken(), "{\"roles\":[\"ADMIN\"]}");
        assertError(response, 403, "Forbidden");
    }

    @Test
    @DisplayName("B9: unknown user -> 404 for GET and for role patch")
    void unknownUser() {
        assertError(get("/users/999999", adminToken()), 404, "Not Found");
        assertError(patch("/users/999999/roles", adminToken(), "{\"roles\":[\"ADMIN\"]}"),
                404, "Not Found");
    }

    private void assertEqualsRoles(Response response, String expectedRole) {
        List<?> roles = (List<?>) at(response, "$.roles");
        assertTrue(roles.contains(expectedRole), "roles were: " + roles);
        assertTrue(roles.size() == 1, "replacement must leave exactly one role: " + roles);
    }
}