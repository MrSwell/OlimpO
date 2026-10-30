package server.olimpo.functional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import server.olimpo.entity.TrainerSchedule;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Phase 2 - Module E: weekly schedule of trainer profile id 1 (trainer2@olimpo.com).
 *
 * The service REPLACES the whole week, so the seeded week is snapshotted before each
 * test and restored afterwards on purpose: after this class the dev DB keeps the exact
 * schedule it had.
 */
class ScheduleFunctionalTest extends BaseFunctionalTest {

    private static final long TRAINER_ID = 1L;

    private List<TrainerSchedule> snapshot;

    private String slots(String... jsonSlots) {
        return "[" + String.join(",", jsonSlots) + "]";
    }

    @BeforeEach
    void snapshotTrainerWeek() {
        snapshot = scheduleRepository.findAll().stream()
                .filter(s -> s.getTrainerId() != null && s.getTrainerId() == TRAINER_ID)
                .toList();
    }

    @AfterEach
    void restoreTrainerWeek() {
        scheduleRepository.findAll().stream()
                .filter(s -> s.getTrainerId() != null && s.getTrainerId() == TRAINER_ID)
                .toList()
                .forEach(scheduleRepository::delete);
        if (!snapshot.isEmpty()) {
            scheduleRepository.saveAll(snapshot);
        }
    }

    @Test
    @DisplayName("E1: ADMIN replaces the week; 2 means Monday and 7 Saturday")
    void adminReplacesWeek() {
        String body = slots(
                "{\"dayOfWeek\":2,\"startTime\":\"06:00\",\"endTime\":\"10:00\"}",
                "{\"dayOfWeek\":7,\"startTime\":\"08:00\",\"endTime\":\"12:00\",\"status\":\"NOT_AVAILABLE\"}");

        Response response = post("/trainers/1/schedules", adminToken(), body);

        assertStatus(response, 200);
        assertEquals(2, ((List<?>) at(response, "$")).size());
        assertEquals("Monday", str(response, "$[0].dayName"));
        assertEquals("AVAILABLE", str(response, "$[0].status"));
        assertEquals("Saturday", str(response, "$[1].dayName"));
        assertEquals("NOT_AVAILABLE", str(response, "$[1].status"));
    }

    @Test
    @DisplayName("E2: GET returns the stored week (after a replace)")
    void getWeek() {
        post("/trainers/1/schedules", adminToken(), slots(
                "{\"dayOfWeek\":2,\"startTime\":\"06:00\",\"endTime\":\"10:00\"}"));
        Response response = get("/trainers/1/schedules", adminToken());

        assertStatus(response, 200);
        assertEquals(1, ((List<?>) at(response, "$")).size());
        assertEquals("Monday", str(response, "$[0].dayName"));
    }

    @Test
    @DisplayName("E3: overlapping slots on the same day -> 409 and the week stays intact")
    void overlapRejected() {
        post("/trainers/1/schedules", adminToken(), slots(
                "{\"dayOfWeek\":3,\"startTime\":\"08:00\",\"endTime\":\"12:00\"}",
                "{\"dayOfWeek\":4,\"startTime\":\"08:00\",\"endTime\":\"12:00\"}"));

        Response overlap = post("/trainers/1/schedules", adminToken(), slots(
                "{\"dayOfWeek\":3,\"startTime\":\"08:00\",\"endTime\":\"12:00\"}",
                "{\"dayOfWeek\":3,\"startTime\":\"10:00\",\"endTime\":\"14:00\"}"));
        assertError(overlap, 409, "Conflict");
        assertTrue(str(overlap, "$.message").contains("Overlapping"));

        Response after = get("/trainers/1/schedules", adminToken());
        assertEquals(2, ((List<?>) at(after, "$")).size(), "failed replace must not modify the week");
    }

    @Test
    @DisplayName("E4: dayOfWeek out of range -> 400 (1=Sunday ... 7=Saturday)")
    void dayOfWeekRange() {
        Response response = post("/trainers/1/schedules", adminToken(),
                slots("{\"dayOfWeek\":8,\"startTime\":\"06:00\",\"endTime\":\"10:00\"}"));

        assertError(response, 400, "Bad Request");
        assertTrue(str(response, "$.message").contains("DayOfWeek must be between 1"));
    }

    @Test
    @DisplayName("E5: endTime must be after startTime -> 400")
    void timeRange() {
        Response response = post("/trainers/1/schedules", adminToken(),
                slots("{\"dayOfWeek\":2,\"startTime\":\"18:00\",\"endTime\":\"09:00\"}"));

        assertError(response, 400, "Bad Request");
        assertTrue(str(response, "$.message").contains("after"));
    }

    @Test
    @DisplayName("E6: unknown status -> 400 with allowed list")
    void invalidStatus() {
        Response response = post("/trainers/1/schedules", adminToken(),
                slots("{\"dayOfWeek\":2,\"startTime\":\"06:00\",\"endTime\":\"10:00\",\"status\":\"FERIADO\"}"));

        assertError(response, 400, "Bad Request");
        assertTrue(str(response, "$.message").contains("AVAILABLE, NOT_AVAILABLE, RESERVED"));
    }

    @Test
    @DisplayName("E7: plain TRAINER reads its own schedule and is blocked on others")
    void trainerOwnAndOthers() {
        assertStatus(get("/trainers/1/schedules", trainerToken()), 200);
        assertError(get("/trainers/2/schedules", trainerToken()), 403, "Forbidden");
    }

    @Test
    @DisplayName("E8: TRAINER_MANAGER plans any week; CLIENT and RECEPCIONIST are locked out")
    void rolesMatrix() {
        assertStatus(get("/trainers/1/schedules", managerToken()), 200);
        assertError(get("/trainers/1/schedules", client1Token()), 403, "Forbidden");
        assertError(get("/trainers/1/schedules", recepToken()), 403, "Forbidden");
    }

    @Test
    @DisplayName("E9: unknown trainer -> 404")
    void unknownTrainer() {
        assertError(get("/trainers/999999/schedules", adminToken()), 404, "Not Found");
    }

    @Test
    @DisplayName("E10: empty slot list -> 400")
    void emptySlots() {
        assertError(post("/trainers/1/schedules", adminToken(), "[]"), 400, "Bad Request");
    }
}