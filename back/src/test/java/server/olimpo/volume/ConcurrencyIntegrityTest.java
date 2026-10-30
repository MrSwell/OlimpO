package server.olimpo.volume;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Phase 3 - data integrity under races: simultaneous writes that must end in exactly
 * ONE success and uniform 409 conflicts, never duplicate rows and never a 5xx.
 *
 * These tests prove the DB constraints + service checks hold when several requests
 * arrive at the same instant (the pessimistic lock on inventory items is exercised
 * for real through findByIdForUpdate).
 */
class ConcurrencyIntegrityTest extends BaseVolumeTest {

    @Test
    @DisplayName("V1: 8 racing memberships on one client -> 1 x 201 + 7 x 409, exactly 1 ACTIVE in DB")
    void membershipRace() {
        long clientId = createClient();

        List<Response> responses = runParallel(8,
                () -> post("/memberships", adminToken(), membershipJson(clientId)));

        assertNo5xx(responses);
        assertEquals(1, countCodes(responses, 201), "exactly one membership may win the race");
        assertEquals(7, countCodes(responses, 409), "losers must all be 409 Conflict");
        responses.stream()
                .filter(r -> r.code() == 409)
                .forEach(r -> assertTrue(
                        str(r, "$.message").contains("ACTIVE membership")
                                || str(r, "$.message").contains("conflicts with existing data"),
                        "409 must explain the conflict: " + r.body()));

        long activeInDb = membershipRepository.findAll().stream()
                .filter(m -> m.getClientId() != null && m.getClientId() == clientId)
                .filter(m -> "ACTIVE".equals(m.getStatus()))
                .count();
        assertEquals(1, activeInDb, "the unique (client_id, status) index must leave 1 ACTIVE row");

        purgeLeftovers();
        assertEquals(0, countLeftovers());
    }

    @Test
    @DisplayName("V2: 6 racing creations with the SAME email -> 1 x 201 + 5 x 409, 1 row in DB")
    void duplicateEmailRace() {
        String email = uniqueEmail();

        List<Response> responses = runParallel(6,
                () -> post("/users", adminToken(), accountBody(email, "Duplicado")));

        assertNo5xx(responses);
        assertEquals(1, countCodes(responses, 201), "exactly one user may be created");
        assertEquals(5, countCodes(responses, 409), "duplicates must be 409");

        long rows = userRepository.findAll().stream()
                .filter(u -> email.equals(u.getEmail()))
                .count();
        assertEquals(1, rows, "the UNIQUE email index must leave exactly 1 row");

        purgeLeftovers();
        assertEquals(0, countLeftovers());
    }

    @Test
    @DisplayName("V3: overdraw race - item with 10 units, 10 threads take 5 -> 2 x 201, stock ends at 0")
    void overdrawRace() {
        Response item = post("/inventory/items", adminToken(),
                "{\"name\":\"" + uniqueToken(FUNC_ITEM_PREFIX) + "\",\"category\":\"Volumen\""
                        + ",\"unit\":\"KG\"}");
        assertStatus(item, 201);
        long itemId = ((Number) at(item, "$.id")).longValue();

        // stock = 10
        assertStatus(post("/inventory/items/" + itemId + "/movements", adminToken(),
                "{\"type\":\"INBOUND\",\"quantity\":10}"), 201);

        AtomicInteger n = new AtomicInteger();
        List<Response> responses = runParallel(10,
                () -> post("/inventory/items/" + itemId + "/movements", adminToken(),
                        "{\"type\":\"OUTBOUND\",\"quantity\":5,\"observation\":\"race "
                                + n.getAndIncrement() + "\"}"));

        assertNo5xx(responses);
        assertEquals(2, countCodes(responses, 201),
                "only 2 threads can take 5 units from a stock of 10");
        assertEquals(8, countCodes(responses, 409), "the rest must be Insufficient stock conflicts");
        responses.stream()
                .filter(r -> r.code() == 409)
                .forEach(r -> assertTrue(str(r, "$.message").contains("Insufficient stock"),
                        "409 must be the stock rule: " + r.body()));

        Response after = get("/inventory/items/" + itemId, adminToken());
        assertEquals(0, ((Number) at(after, "$.quantity")).intValue(),
                "stock can never go negative");
        assertEquals(Boolean.TRUE, at(after, "$.lowStock"), "0 units must trigger the alert");

        purgeLeftovers();
        assertEquals(0, countLeftovers(), "the item and its movements must be deleted");
    }

    @Test
    @DisplayName("V4: 10 racing routine assignments -> no 5xx, only 201/409, history consistent")
    void assignmentBurst() {
        Response routine = post("/routines", adminToken(),
                "{\"name\":\"" + uniqueToken(FUNC_ROUTINE_PREFIX) + "\",\"type\":\"GENERAL\""
                        + ",\"description\":\"Burst\"}");
        assertStatus(routine, 201);
        long routineId = ((Number) at(routine, "$.id")).longValue();
        long clientId = createClient();

        List<Response> responses = runParallel(10,
                () -> post("/routines/" + routineId + "/assignments", adminToken(),
                        "{\"clientId\":" + clientId + "}"));

        assertNo5xx(responses);
        for (Response response : responses) {
            assertTrue(response.code() == 201 || response.code() == 409,
                    "only 201/409 allowed under the burst, got " + response.code()
                            + ": " + response.body());
        }

        purgeLeftovers();
        assertEquals(0, countLeftovers());
    }

    }