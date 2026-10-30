package server.olimpo.volume;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import server.olimpo.entity.TrainerSchedule;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Phase 3 - weekly schedule under stress: the POST replaces the whole week, so it must
 * never duplicate nor partially lose slots while being hammered.
 *
 * The seeded week of trainer id 1 is snapshotted before each test and restored
 * afterwards: after this class the dev DB keeps the exact schedule it had.
 */
class ScheduleReplaceStressTest extends BaseVolumeTest {

    private static final long TRAINER_ID = 1L;
    private static final int SLOTS_PER_WEEK = 14;   // 7 days x 2 slots

    private List<TrainerSchedule> snapshot;

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

    /** A full 7-day week with 2 non-overlapping slots per day (14 slots). */
    private String fullWeekJson() {
        StringBuilder slots = new StringBuilder("[");
        for (int day = 1; day <= 7; day++) {
            if (day > 1) {
                slots.append(',');
            }
            slots.append("{\"dayOfWeek\":").append(day)
                    .append(",\"startTime\":\"06:00\",\"endTime\":\"10:00\"},");
            slots.append("{\"dayOfWeek\":").append(day)
                    .append(",\"startTime\":\"18:00\",\"endTime\":\"21:00\"}");
        }
        return slots.append(']').toString();
    }

    @Test
    @DisplayName("V1: 15 full-week replaces in a row -> every response keeps exactly 14 slots")
    void fifteenReplaces() {
        long start = System.currentTimeMillis();

        for (int i = 1; i <= 15; i++) {
            Response replaced = post("/trainers/1/schedules", adminToken(), fullWeekJson());
            assertStatus(replaced, 200);
            assertEquals(SLOTS_PER_WEEK, ((List<?>) at(replaced, "$")).size(),
                    "replace #" + i + " must return the complete 14-slot week");
        }

        Response stored = get("/trainers/1/schedules", adminToken());
        assertStatus(stored, 200);
        assertEquals(SLOTS_PER_WEEK, ((List<?>) at(stored, "$")).size(),
                "after 15 replaces the DB must hold exactly 14 slots (no duplication, no loss)");

        // Monday (dayOfWeek = 2) must still hold exactly 2 slots
        long monday = ((List<?>) at(stored, "$")).stream()
                .filter(row -> Integer.valueOf(2).equals(
                        ((java.util.Map<?, ?>) row).get("dayOfWeek")))
                .count();
        assertEquals(2, monday, "Monday must keep exactly 2 slots");

        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 20_000,
                "15 replaces + verify must stay under 20s, took " + elapsed + "ms");
    }

    @Test
    @DisplayName("V2: re-posting the SAME week 5 times does not duplicate any slot")
    void repeatReplaceDoesNotDuplicate() {
        for (int i = 0; i < 5; i++) {
            assertStatus(post("/trainers/1/schedules", adminToken(), fullWeekJson()), 200);
        }

        Response stored = get("/trainers/1/schedules", adminToken());
        assertEquals(SLOTS_PER_WEEK, ((List<?>) at(stored, "$")).size(),
                "idempotent replacement: still 14 slots after 5 identical posts");

        long rowsInDb = scheduleRepository.findAll().stream()
                .filter(s -> s.getTrainerId() != null && s.getTrainerId() == TRAINER_ID)
                .count();
        assertEquals(SLOTS_PER_WEEK, rowsInDb, "DB rows must match the API response exactly");
    }

    @Test
    @DisplayName("V3: 16 parallel reads of the week while a replace is in flight -> no 5xx")
    void parallelReadsDuringReplace() {
        String week = fullWeekJson();
        assertStatus(post("/trainers/1/schedules", adminToken(), week), 200);

        AtomicInteger n = new AtomicInteger();
        List<Response> responses = runParallel(16, () -> {
            int turn = n.getAndIncrement();
            if (turn % 4 == 0) {
                // interleave a writer to prove readers never see a broken/5xx state
                return post("/trainers/1/schedules", adminToken(), week);
            }
            return get("/trainers/1/schedules", adminToken());
        });

        assertNo5xx(responses);
        for (Response response : responses) {
            assertEquals(200, response.code(), "readers/writers must all see 200 | " + response.body());
            assertEquals(SLOTS_PER_WEEK, ((List<?>) at(response, "$")).size(),
                    "every response (read or write) must carry the full 14-slot week");
        }
    }

    }