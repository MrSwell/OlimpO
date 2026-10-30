package server.olimpo.functional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Phase 2 - Module C: clients, memberships (durations, 1-ACTIVE), payments, access matrix. */
class ClientMembershipFunctionalTest extends BaseFunctionalTest {

    private Response createClient(String sex) {
        String email = uniqueEmail();
        Response response = post("/clients", adminToken(),
                "{\"email\":\"" + email + "\",\"password\":\"" + FUNC_PASSWORD + "\""
                        + ",\"firstName\":\"Func\", \"lastName\":\"Client\""
                        + ",\"phone\":\"3110000001\""
                        + ",\"documentNumber\":\"" + uniqueDocument() + "\""
                        + ",\"sex\":\"" + sex + "\",\"fitnessGoal\":\"Pruebas funcionales\"}");
        assertStatus(response, 201);
        return response;
    }

    private String membershipBody(long clientId, String type) {
        return "{\"clientId\":" + clientId + ",\"type\":\"" + type + "\""
                + ",\"price\":120000,\"method\":\"CASH\",\"reference\":\"REF-FUNC\"}";
    }

    @Test
    @DisplayName("C1: ADMIN registers a client -> 201 with profile + CLIENT role")
    void createClient() {
        Response response = createClient("F");

        assertTrue(str(response, "$.id") != null);
        assertTrue(str(response, "$.email").startsWith(FUNC_EMAIL_PREFIX));
        assertEquals("F", str(response, "$.sex"));
        assertEquals("ACTIVE", str(response, "$.status"));
    }

    @Test
    @DisplayName("C2: TRAINER cannot create clients -> 403")
    void createClientAsTrainerForbidden() {
        Response response = post("/clients", managerToken(),
                "{\"email\":\"" + uniqueEmail() + "\",\"password\":\"" + FUNC_PASSWORD + "\""
                        + ",\"firstName\":\"X\", \"lastName\":\"Y\", \"documentNumber\":\"" + uniqueDocument() + "\"}");

        assertError(response, 403, "Forbidden");
    }

    @Test
    @DisplayName("C3: own client reads itself and cannot read another client; staff sees all")
    void clientAccessMatrix() {
        Response created = createClient("M");
        long clientId = ((Number) at(created, "$.id")).longValue();
        String ownToken = login(str(created, "$.email"), FUNC_PASSWORD);

        assertStatus(get("/clients/" + clientId, ownToken), 200);          // own profile
        assertError(get("/clients/1", ownToken), 403, "Forbidden");        // cliente1 is someone else
        assertStatus(get("/clients/" + clientId, adminToken()), 200);      // staff sees all
    }

    @Test
    @DisplayName("C4: MONTHLY membership runs exactly 30 days and registers a payment")
    void createMonthlyMembership() {
        long clientId = ((Number) at(createClient("F"), "$.id")).longValue();

        Response response = post("/memberships", adminToken(), membershipBody(clientId, "MONTHLY"));

        assertStatus(response, 201);
        assertEquals("ACTIVE", str(response, "$.status"));
        assertEquals(LocalDate.now().toString(), str(response, "$.startDate"));
        assertEquals(LocalDate.now().plusDays(30).toString(), str(response, "$.endDate"));
    }

    @Test
    @DisplayName("C5: second ACTIVE membership on the same client -> 409")
    void onlyOneActiveMembership() {
        long clientId = ((Number) at(createClient("F"), "$.id")).longValue();
        post("/memberships", adminToken(), membershipBody(clientId, "MONTHLY"));
        Response second = post("/memberships", adminToken(), membershipBody(clientId, "QUARTERLY"));

        assertError(second, 409, "Conflict");
        assertTrue(str(second, "$.message").contains("ACTIVE membership"));
    }

    @Test
    @DisplayName("C6: DAILY membership lasts 1 day (daily passes are memberships too)")
    void dailyMembership() {
        long clientId = ((Number) at(createClient("M"), "$.id")).longValue();

        Response response = post("/memberships", adminToken(), membershipBody(clientId, "DAILY"));

        assertStatus(response, 201);
        assertEquals(LocalDate.now().plusDays(1).toString(), str(response, "$.endDate"));
    }

    @Test
    @DisplayName("C7: unknown type or method -> 400 with the allowed list")
    void invalidMembershipInput() {
        long clientId = ((Number) at(createClient("M"), "$.id")).longValue();

        Response badType = post("/memberships", adminToken(), membershipBody(clientId, "YEARLY"));
        assertError(badType, 400, "Bad Request");
        assertTrue(str(badType, "$.message").contains("DAILY, QUARTERLY, MONTHLY"));

        String body = membershipBody(clientId, "MONTHLY").replace("CASH", "BITCOIN");
        Response badMethod = post("/memberships", adminToken(), body);
        assertError(badMethod, 400, "Bad Request");
        assertTrue(str(badMethod, "$.message").contains("CASH, CARD, TRANSFER, NEQUI"));
    }

    @Test
    @DisplayName("C8: /memberships/active for staff requires clientId and returns it")
    void activeAsStaff() {
        long clientId = ((Number) at(createClient("F"), "$.id")).longValue();
        post("/memberships", adminToken(), membershipBody(clientId, "MONTHLY"));

        Response response = get("/memberships/active?clientId=" + clientId, adminToken());

        assertStatus(response, 200);
        assertEquals("ACTIVE", str(response, "$.status"));
        assertEquals(clientId, ((Number) at(response, "$.clientId")).longValue());

        assertError(get("/memberships/active", recepToken()), 400, "Bad Request");
    }

    @Test
    @DisplayName("C9: a CLIENT always reads its own active membership (no param needed)")
    void activeAsOwnClient() {
        Response created = createClient("F");
        long clientId = ((Number) at(created, "$.id")).longValue();
        post("/memberships", adminToken(), membershipBody(clientId, "MONTHLY"));

        String ownToken = login(str(created, "$.email"), FUNC_PASSWORD);
        Response response = get("/memberships/active", ownToken);

        assertStatus(response, 200);
        assertEquals(clientId, ((Number) at(response, "$.clientId")).longValue());
    }

    @Test
    @DisplayName("C10: renew extends from max(endDate, today): +15 days for QUARTERLY")
    void renewExtendsEndDate() {
        long clientId = ((Number) at(createClient("F"), "$.id")).longValue();
        Response created = post("/memberships", adminToken(), membershipBody(clientId, "MONTHLY"));
        long membershipId = ((Number) at(created, "$.id")).longValue();
        String before = str(created, "$.endDate");

        Response renewed = patch("/memberships/" + membershipId + "/renew", adminToken(),
                "{\"type\":\"QUARTERLY\",\"price\":80000,\"method\":\"CARD\",\"reference\":\"REF-RENEW\"}");

        assertStatus(renewed, 200);
        assertEquals(LocalDate.parse(before).plusDays(15).toString(), str(renewed, "$.endDate"));
        assertEquals("QUARTERLY", str(renewed, "$.type"));
    }

    @Test
    @DisplayName("C11: manual payment -> 201 NEQUI (renews also auto-pay, purged after)")
    void recordPayment() {
        long clientId = ((Number) at(createClient("F"), "$.id")).longValue();
        Response created = post("/memberships", adminToken(), membershipBody(clientId, "MONTHLY"));
        long membershipId = ((Number) at(created, "$.id")).longValue();

        Response response = post("/payments", adminToken(),
                "{\"membershipId\":" + membershipId + ",\"amount\":50000"
                        + ",\"method\":\"nequi\",\"reference\":\"REF-PAY\"}");

        assertStatus(response, 201);
        assertEquals("NEQUI", str(response, "$.method"));
        assertEquals(membershipId, ((Number) at(response, "$.membershipId")).longValue());
    }

    @Test
    @DisplayName("C12: payment amount <= 0 -> 400; unknown membership -> 404")
    void paymentValidation() {
        long clientId = ((Number) at(createClient("F"), "$.id")).longValue();
        Response created = post("/memberships", adminToken(), membershipBody(clientId, "MONTHLY"));
        long membershipId = ((Number) at(created, "$.id")).longValue();

        Response zero = post("/payments", adminToken(),
                "{\"membershipId\":" + membershipId + ",\"amount\":0,\"method\":\"CASH\"}");
        assertError(zero, 400, "Bad Request");
        assertTrue(str(zero, "$.message").contains("greater than zero"));

        Response unknown = post("/payments", adminToken(),
                "{\"membershipId\":999999,\"amount\":1000,\"method\":\"CASH\"}");
        assertError(unknown, 404, "Not Found");
    }

    @Test
    @DisplayName("C13: unknown client -> 404 on profile; unknown ACTIVE lookup -> 404")
    void unknownClient() {
        assertError(get("/clients/999999", adminToken()), 404, "Not Found");
        Response active = get("/memberships/active?clientId=999999", adminToken());
        assertError(active, 404, "Not Found");
        assertTrue(str(active, "$.message").contains("No ACTIVE membership"));
    }

    @Test
    @DisplayName("C14: TRAINER is not staff for clients -> 403 on read")
    void trainerCannotReadClients() {
        Response created = createClient("M");
        long clientId = ((Number) at(created, "$.id")).longValue();
        assertError(get("/clients/" + clientId, managerToken()), 403, "Forbidden");
    }

    @Test
    @DisplayName("C15: seeded cliente1 lists its own memberships (client-side route)")
    void cliente1ListsOwnMemberships() {
        Response response = get("/clients/1/memberships", client1Token());
        assertStatus(response, 200);
        assertFalse(response.body().contains("func.test"), "must not leak functional-test rows");
    }
}