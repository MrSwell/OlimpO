package server.olimpo.volume;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Phase 3 - bulk inserts and pagination walks: large sets created through the API,
 * read back page by page with stable totals, then purged (the BD no sufra).
 */
class BulkDataVolumeTest extends BaseVolumeTest {

    @Test
    @DisplayName("V1: 40 clients; paginated walk (size=10) keeps a stable total, search matches 40")
    void bulkClientsPaginated() {
        int total = 40;
        long baseline = pageTotal("/clients?search=func.test&size=1");

        for (int i = 0; i < total; i++) {
            Response created = post("/clients", adminToken(), newClientJson());
            assertStatus(created, 201);
        }

        long expected = baseline + total;
        // Walk every page of the search and collect the emails we created.
        Set<String> seen = new HashSet<>();
        int pages = (int) Math.ceil(expected / 10.0);
        for (int page = 0; page < pages; page++) {
            Response chunk = get("/clients?search=func.test&size=10&page=" + page, adminToken());
            assertStatus(chunk, 200);
            assertEquals(expected, ((Number) at(chunk, "$.totalElements")).longValue(),
                    "totalElements must stay stable while walking page " + page);
            List<?> content = (List<?>) at(chunk, "$.content");
            for (Object row : content) {
                String email = ((java.util.Map<?, ?>) row).get("email").toString();
                if (email.startsWith(FUNC_EMAIL_PREFIX)) {
                    seen.add(email);
                }
            }
        }
        assertEquals(total, seen.size(), "every created client must be read exactly once");

        // search=func.test alone must see exactly our block (baseline rows are func too)
        assertEquals(total, pageTotal("/clients?search=func.test&size=1"),
                "search must match exactly the created block");

        // ---- deletes: purge everything this test created and verify 0 leftovers
        purgeLeftovers();
        assertEquals(0, countLeftovers(), "bulk clients must be fully deletable");
        assertEquals(0, pageTotal("/clients?search=func.test&size=1"),
                "no func.test client may survive the purge");
    }

    @Test
    @DisplayName("V2: 10 membership attempts on 1 client -> exactly 1 x 201 and 9 x 409, /active resolves")
    void membershipConflictChain() {
        long clientId = createClient();

        int created = 0;
        int conflicts = 0;
        for (int i = 0; i < 10; i++) {
            Response response = post("/memberships", adminToken(), membershipJson(clientId));
            if (response.code() == 201) {
                created++;
            } else if (response.code() == 409) {
                conflicts++;
            } else {
                assertStatus(response, 201); // fails with the real code/body if anything else
            }
        }

        assertEquals(1, created, "only one ACTIVE membership is allowed");
        assertEquals(9, conflicts, "every other attempt must be a 409 conflict");

        Response active = get("/memberships/active?clientId=" + clientId, adminToken());
        assertStatus(active, 200);
        assertEquals("ACTIVE", str(active, "$.status"));

        purgeLeftovers();
        assertEquals(0, countLeftovers());
    }

    @Test
    @DisplayName("V3: boundary payloads - description 2000/2001 and firstName 100/101 chars")
    void boundaryPayloads() {
        String longDescription2000 = "x".repeat(2000);
        String longDescription2001 = "x".repeat(2001);

        Response okRoutine = post("/routines", adminToken(),
                "{\"name\":\"" + uniqueToken(FUNC_ROUTINE_PREFIX) + "\",\"type\":\"GENERAL\""
                        + ",\"description\":\"" + longDescription2000 + "\"}");
        assertStatus(okRoutine, 201);

        Response tooLongRoutine = post("/routines", adminToken(),
                "{\"name\":\"" + uniqueToken(FUNC_ROUTINE_PREFIX) + "\",\"type\":\"GENERAL\""
                        + ",\"description\":\"" + longDescription2001 + "\"}");
        assertError(tooLongRoutine, 400, "Bad Request");
        assertTrue(str(tooLongRoutine, "$.message").contains("Description cannot exceed 2000"));

        Response okClient = post("/clients", adminToken(),
                clientBody("V".repeat(100)));
        assertStatus(okClient, 201);

        Response tooLongClient = post("/clients", adminToken(),
                clientBody("V".repeat(101)));
        assertError(tooLongClient, 400, "Bad Request");
        assertTrue(str(tooLongClient, "$.message").contains("First name cannot exceed 100"));

        // out-of-range pagination keeps the unified 400 (Pagination.MAX_SIZE = 100)
        assertError(get("/clients?size=101", adminToken()), 400, "Bad Request");
        assertError(get("/clients?page=-1", adminToken()), 400, "Bad Request");

        purgeLeftovers();
        assertEquals(0, countLeftovers());
    }

    @Test
    @DisplayName("V4: 15 users created; /users?size=5 walk sees all 15, then purged")
    void usersPaginationWalk() {
        Set<String> expected = new HashSet<>();
        for (int i = 0; i < 15; i++) {
            String email = uniqueEmail();
            expected.add(email);
            Response created = post("/users", adminToken(), accountBody(email, "Volumen"));
            assertStatus(created, 201);
        }

        long total = pageTotal("/users?search=func.test&size=1");
        assertEquals(15, total, "search=func.test must match exactly the 15 created users");

        Set<String> seen = new HashSet<>();
        int pages = (int) Math.ceil(total / 5.0);
        for (int page = 0; page < pages; page++) {
            Response chunk = get("/users?search=func.test&size=5&page=" + page, adminToken());
            assertStatus(chunk, 200);
            assertEquals(5, ((Number) at(chunk, "$.size")).intValue(), "page size honored");
            List<?> content = (List<?>) at(chunk, "$.content");
            for (Object row : content) {
                seen.add(((java.util.Map<?, ?>) row).get("email").toString());
            }
        }
        assertEquals(expected, seen, "walk must return every created user exactly once");

        purgeLeftovers();
        assertEquals(0, countLeftovers());
        assertEquals(0, pageTotal("/users?search=func.test&size=1"));
    }

    @Test
    @DisplayName("V5: 100 movements (50 INBOUND x2 + 50 OUTBOUND x1) -> final quantity 50, history of 100")
    void hundredMovements() {
        Response item = post("/inventory/items", adminToken(),
                "{\"name\":\"" + uniqueToken(FUNC_ITEM_PREFIX) + "\",\"category\":\"Volumen\""
                        + ",\"unit\":\"KG\"}");
        assertStatus(item, 201);
        long itemId = ((Number) at(item, "$.id")).longValue();

        List<Response> movements = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            movements.add(post("/inventory/items/" + itemId + "/movements", adminToken(),
                    "{\"type\":\"INBOUND\",\"quantity\":2,\"observation\":\"volume in\"}"));
        }
        for (int i = 0; i < 50; i++) {
            movements.add(post("/inventory/items/" + itemId + "/movements", adminToken(),
                    "{\"type\":\"OUTBOUND\",\"quantity\":1,\"observation\":\"volume out\"}"));
        }
        assertNo5xx(movements);
        assertAllStatus(movements, 201);

        Response after = get("/inventory/items/" + itemId, adminToken());
        assertEquals(50, ((Number) at(after, "$.quantity")).intValue(),
                "50x2 in - 50x1 out must leave exactly 50 units");

        Response history = get("/inventory/items/" + itemId + "/movements?size=100", adminToken());
        assertStatus(history, 200);
        assertEquals(100, ((Number) at(history, "$.totalElements")).longValue(),
                "all 100 movements must be in the history");

        // deletes: purge deletes the 100 movements (RESTRICT FK) before the item
        purgeLeftovers();
        assertEquals(0, countLeftovers(), "item and its 100 movements must be fully deleted");
    }

    // ------------------------------------------------------------------ helpers

    private long pageTotal(String path) {
        Response response = get(path, adminToken());
        assertStatus(response, 200);
        return ((Number) at(response, "$.totalElements")).longValue();
    }

    /** Client registration body with the given firstName (unique email + unique document). */
    private String clientBody(String firstName) {
        return "{\"email\":\"" + uniqueEmail() + "\",\"password\":\"" + FUNC_PASSWORD + "\""
                + ",\"firstName\":\"" + firstName + "\",\"lastName\":\"Prueba\""
                + ",\"documentNumber\":\"" + uniqueDocument() + "\"}";
    }
}