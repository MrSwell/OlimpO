package server.olimpo.functional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Phase 2 - Module F: routine catalog, GENERAL/CUSTOM rules, assignments and client visibility. */
class RoutineFunctionalTest extends BaseFunctionalTest {

    private String routineBody(String name, String type, String price, Long trainerId) {
        String priceField = price == null ? "" : ",\"price\":" + price;
        String trainerField = trainerId == null ? "" : ",\"trainerId\":" + trainerId;
        return "{\"name\":\"" + name + "\",\"type\":\"" + type + "\""
                + ",\"description\":\"Plan de prueba funcional\"" + priceField + trainerField + "}";
    }

    private long createGeneralRoutine() {
        Response response = post("/routines", adminToken(),
                routineBody(uniqueToken(FUNC_ROUTINE_PREFIX), "GENERAL", null, null));
        assertStatus(response, 201);
        return ((Number) at(response, "$.id")).longValue();
    }

    private Response createFuncClientResponse() {
        Response response = post("/clients", adminToken(),
                "{\"email\":\"" + uniqueEmail() + "\",\"password\":\"" + FUNC_PASSWORD + "\""
                        + ",\"firstName\":\"Func\", \"lastName\":\"Client\""
                        + ",\"documentNumber\":\"" + uniqueDocument() + "\"}");
        assertStatus(response, 201);
        return response;
    }

    private long createFuncClient() {
        return ((Number) at(createFuncClientResponse(), "$.id")).longValue();
    }

    @Test
    @DisplayName("F1: catalog listing works for staff and CLIENT")
    void catalog() {
        assertStatus(get("/routines", adminToken()), 200);
        assertStatus(get("/routines?type=CUSTOM", adminToken()), 200);
        assertStatus(get("/routines", client1Token()), 200);
    }

    @Test
    @DisplayName("F2: GENERAL routine -> 201 with null trainer and null price")
    void generalRoutine() {
        String name = uniqueToken(FUNC_ROUTINE_PREFIX);
        Response response = post("/routines", adminToken(), routineBody(name, "GENERAL", null, null));

        assertStatus(response, 201);
        assertEquals(name, str(response, "$.name"));
        assertTrue(response.body().contains("\"trainerId\":null"), response.body());
        assertTrue(response.body().contains("\"price\":null"), response.body());
    }

    @Test
    @DisplayName("F3: GENERAL with price or unknown type -> 400")
    void generalInvalidInput() {
        Response withPrice = post("/routines", adminToken(),
                routineBody(uniqueToken(FUNC_ROUTINE_PREFIX), "GENERAL", "50.00", null));
        assertError(withPrice, 400, "Bad Request");
        assertTrue(str(withPrice, "$.message").contains("only allowed for CUSTOM"));

        Response badType = post("/routines", adminToken(),
                routineBody(uniqueToken(FUNC_ROUTINE_PREFIX), "PREMIUM", null, null));
        assertError(badType, 400, "Bad Request");
        assertTrue(str(badType, "$.message").contains("GENERAL, CUSTOM"));
    }

    @Test
    @DisplayName("F4: ADMIN creates a CUSTOM routine with an explicit trainer -> 201 with trainerName")
    void customRoutineWithTrainer() {
        Response response = post("/routines", adminToken(),
                routineBody(uniqueToken(FUNC_ROUTINE_PREFIX), "CUSTOM", "80000", 2L));

        assertStatus(response, 201);
        assertEquals("CUSTOM", str(response, "$.type"));
        assertEquals(2, ((Number) at(response, "$.trainerId")).intValue());
        assertTrue(str(response, "$.trainerName") != null && !str(response, "$.trainerName").isBlank(),
                "trainer name must be resolved");
    }

    @Test
    @DisplayName("F5: CUSTOM without price -> 400")
    void customNeedsPrice() {
        Response response = post("/routines", adminToken(),
                routineBody(uniqueToken(FUNC_ROUTINE_PREFIX), "CUSTOM", null, 2L));

        assertError(response, 400, "Bad Request");
        assertTrue(str(response, "$.message").contains("price greater than 0"));
    }

    @Test
    @DisplayName("F6: CLIENT cannot create routines -> 403")
    void clientDenied() {
        Response response = post("/routines", client1Token(),
                routineBody(uniqueToken(FUNC_ROUTINE_PREFIX), "GENERAL", null, null));
        assertError(response, 403, "Forbidden");
    }

    @Test
    @DisplayName("F7: assignment defaults to ACTIVE with today's date and resolves the client name")
    void assignRoutine() {
        long routineId = createGeneralRoutine();
        long clientId = createFuncClient();

        Response response = post("/routines/" + routineId + "/assignments", adminToken(),
                "{\"clientId\":" + clientId + "}");

        assertStatus(response, 201);
        assertEquals("ACTIVE", str(response, "$.status"));
        assertEquals(LocalDate.now().toString(), str(response, "$.assignmentDate"));
        assertTrue(str(response, "$.clientName").contains("Func"), str(response, "$.clientName"));
        assertTrue(str(response, "$.routineName").startsWith(FUNC_ROUTINE_PREFIX));
    }

    @Test
    @DisplayName("F8: assignment to an unknown client -> 404; invalid status -> 400")
    void assignmentValidation() {
        long routineId = createGeneralRoutine();

        Response unknown = post("/routines/" + routineId + "/assignments", adminToken(),
                "{\"clientId\":999999}");
        assertError(unknown, 404, "Not Found");

        Response badStatus = post("/routines/" + routineId + "/assignments", adminToken(),
                "{\"clientId\":1,\"status\":\"FINALIZADA\"}");
        assertError(badStatus, 400, "Bad Request");
        assertTrue(str(badStatus, "$.message").contains("ACTIVE, COMPLETED, CANCELLED"));
    }

    @Test
    @DisplayName("F9: staff reads the assignment history of a routine")
    void assignmentHistory() {
        long routineId = createGeneralRoutine();
        long clientId = createFuncClient();
        post("/routines/" + routineId + "/assignments", adminToken(), "{\"clientId\":" + clientId + "}");

        Response response = get("/routines/" + routineId + "/assignments", adminToken());

        assertStatus(response, 200);
        List<?> content = (List<?>) at(response, "$.content");
        assertEquals(1, content.size());
    }

    @Test
    @DisplayName("F10: a client reads its own routine list; other clients get 403")
    void clientOwnRoutines() {
        Response createdClient = createFuncClientResponse();
        long clientId = ((Number) at(createdClient, "$.id")).longValue();
        long routineId = createGeneralRoutine();
        post("/routines/" + routineId + "/assignments", adminToken(), "{\"clientId\":" + clientId + "}");

        String ownToken = login(str(createdClient, "$.email"), FUNC_PASSWORD);

        Response own = get("/clients/" + clientId + "/routines", ownToken);
        assertStatus(own, 200);
        assertTrue(((List<?>) at(own, "$.content")).size() >= 1, "own assignment must be listed");

        assertError(get("/clients/" + clientId + "/routines", client1Token()), 403, "Forbidden");
        assertStatus(get("/clients/" + clientId + "/routines", adminToken()), 200);
    }
}