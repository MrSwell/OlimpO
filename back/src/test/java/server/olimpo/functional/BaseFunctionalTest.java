package server.olimpo.functional;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import server.olimpo.entity.Client;
import server.olimpo.entity.InventoryItem;
import server.olimpo.entity.Membership;
import server.olimpo.entity.Routine;
import server.olimpo.entity.User;
import server.olimpo.repository.ClientRepository;
import server.olimpo.repository.InventoryItemRepository;
import server.olimpo.repository.InventoryMovementRepository;
import server.olimpo.repository.MachineRepository;
import server.olimpo.repository.MembershipRepository;
import server.olimpo.repository.PaymentRepository;
import server.olimpo.repository.RoutineAssignmentRepository;
import server.olimpo.repository.RoutineRepository;
import server.olimpo.repository.TrainerRepository;
import server.olimpo.repository.TrainerScheduleRepository;
import server.olimpo.repository.UserRepository;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Base for phase 2 (functional): boots the FULL application (security, MVC, JPA,
 * Flyway) on a random port against the real local MySQL and talks plain HTTP with
 * the JDK HttpClient.
 *
 * Cleanup contract ("la BD no sufra"): every test's data uses the FUNC prefixes;
 * {@link #purgeLeftovers()} runs BEFORE the class (removes orphans of crashed runs)
 * and AFTER EVERY test, and the count of leftover rows must be 0 afterwards.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseFunctionalTest {

    protected static final String API = "/api/v1";
    protected static final String FUNC_EMAIL_PREFIX = "func.test";
    protected static final String FUNC_PASSWORD = "func1234";
    protected static final String FUNC_ITEM_PREFIX = "FUNC TEST item";
    protected static final String FUNC_ROUTINE_PREFIX = "FUNC TEST routine";
    protected static final String FUNC_SERIAL_PREFIX = "FUNC-SERIAL";
    protected static final String FUNC_DOC_PREFIX = "FUNC-DOC";

    @LocalServerPort
    protected int port;

    @Autowired protected UserRepository userRepository;
    @Autowired protected TrainerRepository trainerRepository;
    @Autowired protected ClientRepository clientRepository;
    @Autowired protected MembershipRepository membershipRepository;
    @Autowired protected PaymentRepository paymentRepository;
    @Autowired protected InventoryItemRepository itemRepository;
    @Autowired protected InventoryMovementRepository movementRepository;
    @Autowired protected MachineRepository machineRepository;
    @Autowired protected RoutineRepository routineRepository;
    @Autowired protected RoutineAssignmentRepository assignmentRepository;
    @Autowired protected TrainerScheduleRepository scheduleRepository;

    private final HttpClient http = HttpClient.newHttpClient();
    private final Map<String, String> tokenCache = new HashMap<>();
    private final java.util.concurrent.atomic.AtomicInteger sequence = new java.util.concurrent.atomic.AtomicInteger();

    /** Raw HTTP response: status code + body text. */
    protected record Response(int code, String body) {}

    // ---------------------------------------------------------------- HTTP

    protected Response call(String method, String path, String token, String body) {
        try {
            String url = "http://localhost:" + port + API + path;
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(java.time.Duration.ofSeconds(20))
                    .header("Content-Type", "application/json; charset=utf-8")
                    .header("Accept", "application/json");
            if (token != null) {
                builder.header("Authorization", "Bearer " + token);
            }
            HttpRequest.BodyPublisher publisher = body == null
                    ? HttpRequest.BodyPublishers.noBody()
                    : HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8);
            builder.method(method, publisher);

            HttpResponse<String> response = http.send(builder.build(),
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            return new Response(response.statusCode(), response.body());
        } catch (IOException e) {
            throw new IllegalStateException("Connection failed: " + method + " " + path, e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted: " + method + " " + path, e);
        }
    }

    protected Response get(String path, String token) { return call("GET", path, token, null); }
    protected Response post(String path, String token, String body) { return call("POST", path, token, body); }
    protected Response patch(String path, String token, String body) { return call("PATCH", path, token, body); }
    protected Response put(String path, String token, String body) { return call("PUT", path, token, body); }

    // ------------------------------------------------------- JSON helpers

    @SuppressWarnings("unchecked")
    protected Map<String, Object> obj(Response response) {
        assertTrue(response.body() != null && !response.body().isBlank(),
                "empty body, not JSON: " + response);
        return (Map<String, Object>) JsonPath.parse(response.body()).read("$");
    }

    protected Object at(Response response, String path) {
        return JsonPath.parse(response.body()).read(path);
    }

    protected String str(Response response, String path) {
        Object value = at(response, path);
        return value == null ? null : value.toString();
    }

    // ------------------------------------------------------------- asserts

    protected void assertStatus(Response response, int expected) {
        assertEquals(expected, response.code(),
                "expected HTTP " + expected + " but got " + response.code() + " | body: " + response.body());
    }

    /** Unified error JSON: {status, error, message} with no internal leakage. */
    protected void assertError(Response response, int expectedStatus, String expectedError) {
        assertStatus(response, expectedStatus);
        Map<String, Object> body = obj(response);
        assertEquals(expectedStatus, ((Number) body.get("status")).intValue(), "status field mismatch");
        assertEquals(expectedError, body.get("error"), "error field mismatch");
        Object message = body.get("message");
        assertTrue(message instanceof String text && !text.isBlank(), "message must be a non-blan string");
        String raw = response.body();
        assertFalse(raw.contains("at server.olimpo"), "stack trace leaked: " + raw);
        assertFalse(raw.contains("passwordHash"), "password hash leaked: " + raw);
        assertFalse(raw.contains(".java:"), "source location leaked: " + raw);
    }

    // ------------------------------------------------------------- login

    protected String login(String email, String password) {
        Response response = post("/auth/login", null,
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}");
        assertStatus(response, 200);
        return str(response, "$.token");
    }

    protected String adminToken() {
        return tokenCache.computeIfAbsent("admin", k -> login("admin@olimpo.com", "admin123"));
    }

    protected String recepToken() {
        return tokenCache.computeIfAbsent("recep", k -> login("recepcionista@olimpo.com", "recep123"));
    }

    /** trainer@olimpo.com: TRAINER + TRAINER_MANAGER (trainer profile id 2). */
    protected String managerToken() {
        return tokenCache.computeIfAbsent("manager", k -> login("trainer@olimpo.com", "trainer123"));
    }

    /** trainer2@olimpo.com: plain TRAINER (trainer profile id 1). */
    protected String trainerToken() {
        return tokenCache.computeIfAbsent("trainer2", k -> login("trainer2@olimpo.com", "trainer123"));
    }

    protected String client1Token() {
        return tokenCache.computeIfAbsent("cliente1", k -> login("cliente1@olimpo.com", "cliente123"));
    }

    // ------------------------------------------------------ unique data

    /** A fresh unique email per invocation, always under the FUNC prefix. */
    protected String uniqueEmail() {
        return FUNC_EMAIL_PREFIX + sequence.incrementAndGet() + "@olimpo.com";
    }

    protected String uniqueToken(String prefix) {
        return prefix + "-" + System.nanoTime() + "-" + sequence.incrementAndGet();
    }

    /** documentNumber is capped at 20 chars: D + 9 digits + counter. */
    protected String uniqueDocument() {
        return "D" + (System.currentTimeMillis() % 1_000_000_000L) + sequence.incrementAndGet();
    }

    // -------------------------------------------------- DB cleanup & audit

    @BeforeAll
    void removeLeftoversFromPreviousRuns() {
        purgeLeftovers();
    }

    /** THE delete check: after every functional test the DB must be FUNC-row-free. */
    @AfterEach
    void verifyDatabaseIsClean() {
        purgeLeftovers();
        assertEquals(0, countLeftovers(),
                "functional test left rows behind - the dev DB must never be polluted");
    }

    protected void purgeLeftovers() {
        // 1. payments -> memberships -> clients -> trainers -> users (FK order, RESTRICT first)
        List<User> funcUsers = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().startsWith(FUNC_EMAIL_PREFIX))
                .toList();
        List<Long> userIds = funcUsers.stream().map(User::getId).toList();
        List<Client> funcClients = clientRepository.findAll().stream()
                .filter(c -> c.getUserId() != null && userIds.contains(c.getUserId()))
                .toList();
        List<Long> clientIds = funcClients.stream().map(Client::getId).toList();
        List<Long> membershipIds = membershipRepository.findAll().stream()
                .filter(m -> clientIds.contains(m.getClientId()))
                .map(Membership::getId)
                .toList();

        paymentRepository.findAll().stream()
                .filter(p -> membershipIds.contains(p.getMembershipId())
                        || (p.getClientId() != null && clientIds.contains(p.getClientId())))
                .forEach(paymentRepository::delete);
        membershipRepository.findAll().stream()
                .filter(m -> clientIds.contains(m.getClientId()))
                .forEach(membershipRepository::delete);
        funcClients.forEach(clientRepository::delete);
        trainerRepository.findAll().stream()
                .filter(t -> t.getUserId() != null && userIds.contains(t.getUserId()))
                .forEach(trainerRepository::delete);
        funcUsers.forEach(userRepository::delete);

        // 2. routines (their assignments cascade away with them)
        routineRepository.findAll().stream()
                .filter(r -> r.getName() != null && r.getName().startsWith(FUNC_ROUTINE_PREFIX))
                .forEach(routineRepository::delete);

        // 3. movements (RESTRICT) -> items
        List<InventoryItem> funcItems = itemRepository.findAll().stream()
                .filter(i -> i.getName() != null && i.getName().startsWith(FUNC_ITEM_PREFIX))
                .toList();
        List<Long> itemIds = funcItems.stream().map(InventoryItem::getId).toList();
        movementRepository.findAll().stream()
                .filter(m -> itemIds.contains(m.getItemId()))
                .forEach(movementRepository::delete);
        funcItems.forEach(itemRepository::delete);

        // 4. machines
        machineRepository.findAll().stream()
                .filter(m -> m.getSerialNumber() != null && m.getSerialNumber().startsWith(FUNC_SERIAL_PREFIX))
                .forEach(machineRepository::delete);
    }

    /** Number of rows that this phase is allowed to create (all zero when clean). */
    protected long countLeftovers() {
        long users = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().startsWith(FUNC_EMAIL_PREFIX)).count();
        long memberships = membershipRepository.findAll().stream()
                .filter(m -> m.getClientId() != null && clientIdsOfFuncUsers().contains(m.getClientId())).count();
        long routines = routineRepository.findAll().stream()
                .filter(r -> r.getName() != null && r.getName().startsWith(FUNC_ROUTINE_PREFIX)).count();
        long items = itemRepository.findAll().stream()
                .filter(i -> i.getName() != null && i.getName().startsWith(FUNC_ITEM_PREFIX)).count();
        long machines = machineRepository.findAll().stream()
                .filter(m -> m.getSerialNumber() != null && m.getSerialNumber().startsWith(FUNC_SERIAL_PREFIX)).count();
        return users + memberships + routines + items + machines;
    }

    private List<Long> clientIdsOfFuncUsers() {
        List<Long> userIds = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().startsWith(FUNC_EMAIL_PREFIX))
                .map(User::getId)
                .toList();
        return clientRepository.findAll().stream()
                .filter(c -> c.getUserId() != null && userIds.contains(c.getUserId()))
                .map(Client::getId)
                .toList();
    }

    // -------------------------------------------------- shared JSON bodies

    protected String accountBody(String email, String firstName) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + FUNC_PASSWORD + "\""
                + ",\"firstName\":\"" + firstName + "\",\"lastName\":\"Funcional\""
                + ",\"phone\":\"3001112233\""
                + ",\"roles\":[\"RECEPCIONIST\"]}";
    }
}