package server.olimpo.volume;

import server.olimpo.functional.BaseFunctionalTest;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Base for phase 3 (volume): inherits the full functional stack (HTTP against the real
 * app + the FUNC-prefix purge contract) and adds concurrency helpers.
 *
 * Every running thread releases at the same time (CyclicBarrier) so races are real, and
 * every assertion includes a "no 5xx" guard: under load the API must degrade with the
 * unified 4xx error JSON, never with a server error.
 */
public abstract class BaseVolumeTest extends BaseFunctionalTest {

    /** Runs one HTTP operation on {@code threads} workers that start simultaneously. */
    protected List<Response> runParallel(int threads, Supplier<Response> operation) {
        CyclicBarrier barrier = new CyclicBarrier(threads);
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        try {
            Callable<Response> task = () -> {
                barrier.await(30, TimeUnit.SECONDS);
                return operation.get();
            };
            List<Future<Response>> futures = pool.invokeAll(
                    java.util.Collections.nCopies(threads, task), 120, TimeUnit.SECONDS);
            List<Response> responses = new ArrayList<>();
            for (Future<Response> future : futures) {
                responses.add(future.get());
            }
            return responses;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("parallel run interrupted", e);
        } catch (Exception e) {
            throw new IllegalStateException("parallel run failed: " + e.getMessage(), e);
        } finally {
            pool.shutdownNow();
        }
    }

    protected void assertNo5xx(List<Response> responses) {
        for (Response response : responses) {
            assertTrue(response.code() < 500,
                    "server error under load: HTTP " + response.code() + " | " + response.body());
        }
    }

    protected long countCodes(List<Response> responses, int code) {
        return responses.stream().filter(r -> r.code() == code).count();
    }

    protected void assertAllStatus(List<Response> responses, int expected) {
        assertEquals(responses.size(), countCodes(responses, expected),
                "expected every response to be " + expected + " | bodies: "
                        + responses.stream().map(r -> r.code() + ":" + r.body()).toList());
    }

    /** Fresh client-registration body with unique email + valid document (<=20 chars). */
    protected String newClientJson() {
        return "{\"email\":\"" + uniqueEmail() + "\",\"password\":\"" + FUNC_PASSWORD + "\""
                + ",\"firstName\":\"Volumen\", \"lastName\":\"Prueba\""
                + ",\"phone\":\"3220001111\""
                + ",\"documentNumber\":\"" + uniqueDocument() + "\"}";
    }

    protected long createClient() {
        Response response = post("/clients", adminToken(), newClientJson());
        assertStatus(response, 201);
        return ((Number) at(response, "$.id")).longValue();
    }

    protected String membershipJson(long clientId) {
        return "{\"clientId\":" + clientId + ",\"type\":\"MONTHLY\",\"price\":120000"
                + ",\"method\":\"CASH\",\"reference\":\"REF-VOL\"}";
    }
}