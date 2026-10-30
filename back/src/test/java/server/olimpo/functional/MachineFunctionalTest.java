package server.olimpo.functional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Phase 2 - Module D (machines): creation, unique serial, status lifecycle and filters. */
class MachineFunctionalTest extends BaseFunctionalTest {

    private String machineBody(String serial, String status) {
        String statusField = status == null ? "" : ",\"status\":\"" + status + "\"";
        return "{\"name\":\"Bici Funcional\",\"brand\":\"NordicTrack\",\"model\":\"X9\""
                + ",\"serialNumber\":\"" + serial + "\"" + statusField + "}";
    }

    @Test
    @DisplayName("E1: creation defaults to AVAILABLE")
    void createMachine() {
        String serial = uniqueToken(FUNC_SERIAL_PREFIX);
        Response response = post("/machines", adminToken(), machineBody(serial, null));

        assertStatus(response, 201);
        assertEquals("AVAILABLE", str(response, "$.status"));
        assertEquals(serial, str(response, "$.serialNumber"));
    }

    @Test
    @DisplayName("E2: duplicated serial number -> 409")
    void duplicateSerial() {
        String serial = uniqueToken(FUNC_SERIAL_PREFIX);
        post("/machines", adminToken(), machineBody(serial, null));
        Response second = post("/machines", adminToken(), machineBody(serial, null));

        assertError(second, 409, "Conflict");
        assertTrue(str(second, "$.message").contains("already exists"));
    }

    @Test
    @DisplayName("E3: PATCH moves the machine to MAINTENANCE and the filter finds it")
    void patchAndFilter() {
        String serial = uniqueToken(FUNC_SERIAL_PREFIX);
        Response created = post("/machines", adminToken(), machineBody(serial, null));
        long id = ((Number) at(created, "$.id")).longValue();

        Response patched = patch("/machines/" + id, adminToken(),
                "{\"name\":\"Bici Funcional\",\"brand\":\"NordicTrack\",\"model\":\"X9\""
                        + ",\"serialNumber\":\"" + serial + "\",\"status\":\"MAINTENANCE\"}");
        assertStatus(patched, 200);
        assertEquals("MAINTENANCE", str(patched, "$.status"));

        Response filtered = get("/machines?status=MAINTENANCE", adminToken());
        assertStatus(filtered, 200);
        assertTrue(filtered.body().contains(serial), "filtered list must contain the patched serial");
    }

    @Test
    @DisplayName("E4: invalid status on create, patch or filter -> 400")
    void invalidStatus() {
        Response onCreate = post("/machines", adminToken(),
                machineBody(uniqueToken(FUNC_SERIAL_PREFIX), "ROTA"));
        assertError(onCreate, 400, "Bad Request");
        assertTrue(str(onCreate, "$.message").contains("AVAILABLE, MAINTENANCE, OUT_OF_SERVICE"));

        long id = ((Number) at(post("/machines", adminToken(), machineBody(uniqueToken(FUNC_SERIAL_PREFIX), null)),
                "$.id")).longValue();
        Response onPatch = patch("/machines/" + id, adminToken(),
                "{\"name\":\"Bici Funcional\",\"status\":\"ROTA\"}");
        assertError(onPatch, 400, "Bad Request");

        assertError(get("/machines?status=ROTA", adminToken()), 400, "Bad Request");
    }

    @Test
    @DisplayName("E5: TRAINER_MANAGER and TRAINER may manage machines -> 201")
    void trainerAllowed() {
        Response response = post("/machines", trainerToken(), machineBody(uniqueToken(FUNC_SERIAL_PREFIX), null));
        assertStatus(response, 201);
    }

    @Test
    @DisplayName("E6: RECEPCIONIST has no machine access -> 403")
    void receptionistDenied() {
        Response response = get("/machines", recepToken());
        assertError(response, 403, "Forbidden");
    }

    @Test
    @DisplayName("E7: unknown machine -> 404")
    void unknownMachine() {
        assertError(get("/machines/999999", adminToken()), 404, "Not Found");
    }

    @Test
    @DisplayName("E8: full list as admin -> 200 with content")
    void listMachines() {
        Response response = get("/machines", adminToken());
        assertStatus(response, 200);
        assertTrue(at(response, "$.content") instanceof List<?> content && !content.isEmpty(),
                "seeded machines must be listed");
    }
}