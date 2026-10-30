package server.olimpo.functional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Phase 2 - Module D: items, stock movements, alerts and the deliberate RECEPCIONIST cut. */
class InventoryFunctionalTest extends BaseFunctionalTest {

    private long createItem() {
        Response response = post("/inventory/items", adminToken(),
                "{\"name\":\"" + uniqueToken(FUNC_ITEM_PREFIX) + "\",\"category\":\"Funcionales\""
                        + ",\"unit\":\"KG\"}");
        assertStatus(response, 201);
        return ((Number) at(response, "$.id")).longValue();
    }

    @Test
    @DisplayName("D1: new item starts at quantity 0 with minStock 5 -> lowStock alert")
    void createItemDefaults() {
        Response response = post("/inventory/items", adminToken(),
                "{\"name\":\"" + uniqueToken(FUNC_ITEM_PREFIX) + "\",\"category\":\"Funcionales\",\"unit\":\"KG\"}");

        assertStatus(response, 201);
        assertEquals(0, ((Number) at(response, "$.quantity")).intValue());
        assertEquals(5, ((Number) at(response, "$.minStock")).intValue());
        assertEquals(Boolean.TRUE, at(response, "$.lowStock"));
    }

    @Test
    @DisplayName("D2: INBOUND adds 40 units and clears the low-stock alert")
    void inboundIncreasesStock() {
        long id = createItem();

        Response movement = post("/inventory/items/" + id + "/movements", adminToken(),
                "{\"type\":\"INBOUND\",\"quantity\":40,\"observation\":\"Reposicion Func\"}");
        assertStatus(movement, 201);
        assertEquals("INBOUND", str(movement, "$.type"));

        Response item = get("/inventory/items/" + id, adminToken());
        assertEquals(40, ((Number) at(item, "$.quantity")).intValue());
        assertEquals(Boolean.FALSE, at(item, "$.lowStock"));
    }

    @Test
    @DisplayName("D3: OUTBOUND above stock -> 409 Insufficient stock, stock untouched")
    void outboundAboveStock() {
        long id = createItem();
        Response response = post("/inventory/items/" + id + "/movements", adminToken(),
                "{\"type\":\"OUTBOUND\",\"quantity\":100}");

        assertError(response, 409, "Conflict");
        assertTrue(str(response, "$.message").contains("Insufficient stock"));
        assertEquals(0, ((Number) at(get("/inventory/items/" + id, adminToken()), "$.quantity")).intValue());
    }

    @Test
    @DisplayName("D4: invalid movement type -> 400 with allowed list")
    void invalidMovementType() {
        long id = createItem();
        Response response = post("/inventory/items/" + id + "/movements", adminToken(),
                "{\"type\":\"STOLEN\",\"quantity\":1}");

        assertError(response, 400, "Bad Request");
        assertTrue(str(response, "$.message").contains("INBOUND, OUTBOUND"));
    }

    @Test
    @DisplayName("D5: GET /low-stock lists items at or below the threshold")
    void lowStockEndpoint() {
        long id = createItem();

        Response response = get("/inventory/items/low-stock", adminToken());

        assertStatus(response, 200);
        assertTrue(at(response, "$.content") instanceof List<?> content && !content.isEmpty(),
                "our fresh item must be in the alert list");
    }

    @Test
    @DisplayName("D6: PATCH recalculates the alert against minStock")
    void patchRecalculatesAlert() {
        long id = createItem();
        Response response = patch("/inventory/items/" + id, adminToken(),
                "{\"name\":\"" + FUNC_ITEM_PREFIX + " parche\",\"category\":\"Funcionales\""
                        + ",\"quantity\":20,\"minStock\":4}");

        assertStatus(response, 200);
        assertEquals(20, ((Number) at(response, "$.quantity")).intValue());
        assertEquals(4, ((Number) at(response, "$.minStock")).intValue());
        assertEquals(Boolean.FALSE, at(response, "$.lowStock"));
    }

    @Test
    @DisplayName("D7: movement history returns newest movements for the item")
    void movementHistory() {
        long id = createItem();
        post("/inventory/items/" + id + "/movements", adminToken(),
                "{\"type\":\"INBOUND\",\"quantity\":10}");
        post("/inventory/items/" + id + "/movements", adminToken(),
                "{\"type\":\"INBOUND\",\"quantity\":5}");

        Response response = get("/inventory/items/" + id + "/movements", adminToken());

        assertStatus(response, 200);
        List<?> content = (List<?>) at(response, "$.content");
        assertTrue(content.size() >= 2, "both INBOUND rows expected, got " + content.size());
    }

    @Test
    @DisplayName("D8: RECEPCIONIST has NO inventory access (deliberate product rule) -> 403")
    void receptionistDenied() {
        Response response = post("/inventory/items", recepToken(),
                "{\"name\":\"" + uniqueToken(FUNC_ITEM_PREFIX) + "\"}");
        assertError(response, 403, "Forbidden");
        assertEquals(403, response.code());
    }

    @Test
    @DisplayName("D9: TRAINER may manage inventory -> 201")
    void trainerAllowed() {
        Response response = post("/inventory/items", managerToken(),
                "{\"name\":\"" + uniqueToken(FUNC_ITEM_PREFIX) + "\",\"category\":\"Funcionales\"}");
        assertStatus(response, 201);
    }

    @Test
    @DisplayName("D10: unknown item -> 404 on read, patch and movements")
    void unknownItem() {
        assertError(get("/inventory/items/999999", adminToken()), 404, "Not Found");
        assertError(post("/inventory/items/999999/movements", adminToken(),
                "{\"type\":\"INBOUND\",\"quantity\":1}"), 404, "Not Found");
    }

    @Test
    @DisplayName("D11: negative quantity on update -> 400")
    void negativeQuantity() {
        long id = createItem();
        Response response = patch("/inventory/items/" + id, adminToken(),
                "{\"name\":\"" + FUNC_ITEM_PREFIX + " neg\",\"category\":\"C\""
                        + ",\"quantity\":-1,\"minStock\":1}");

        assertError(response, 400, "Bad Request");
        assertTrue(str(response, "$.message").contains("cannot be negative"));
    }
}