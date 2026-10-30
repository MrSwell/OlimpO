package server.olimpo.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import server.olimpo.dto.request.CreateInventoryItemRequest;
import server.olimpo.dto.request.InventoryMovementRequest;
import server.olimpo.dto.request.UpdateInventoryItemRequest;
import server.olimpo.dto.response.InventoryItemResponse;
import server.olimpo.dto.response.InventoryMovementResponse;
import server.olimpo.entity.InventoryItem;
import server.olimpo.entity.InventoryMovement;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.InventoryItemRepository;
import server.olimpo.repository.InventoryMovementRepository;
import server.olimpo.service.InventoryService;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryItemRepository itemRepository;
    @Mock
    private InventoryMovementRepository movementRepository;

    private InventoryService service() {
        return new InventoryService(itemRepository, movementRepository);
    }

    private InventoryItem item(long id, int quantity, int minStock) {
        return InventoryItem.builder().id(id).name("Whey protein 1kg")
                .category("Suplementos").quantity(quantity).minStock(minStock).unit("KG").build();
    }

    @Test
    @DisplayName("S4: creating an item defaults quantity=0 and minStock=5 (low stock alert)")
    void createItemDefaults() {
        when(itemRepository.save(any(InventoryItem.class))).thenAnswer(inv -> {
            InventoryItem i = inv.getArgument(0);
            i.setId(10L);
            return i;
        });

        InventoryItemResponse response = service().createItem(
                new CreateInventoryItemRequest("Whey protein 1kg", "Suplementos", null, null, "KG"));

        assertEquals(10L, response.id());
        assertEquals(0, response.quantity());
        assertEquals(5, response.minStock());
        assertTrue(response.lowStock());
    }

    @Test
    @DisplayName("S4: negative quantity or minStock -> 400")
    void negativeQuantityRejected() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().createItem(
                        new CreateInventoryItemRequest("Tarjeta", "Accesorios", -3, 5, "UN")));
        assertTrue(ex.getMessage().contains("cannot be negative"));
        verify(itemRepository, never()).save(any());
    }

    @Test
    @DisplayName("S4: update recalculates lowStock below the threshold")
    void updateItemRecalculatesLowStock() {
        InventoryItem item = item(1L, 40, 5);
        when(itemRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));
        when(itemRepository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryItemResponse response = service().updateItem(1L,
                new UpdateInventoryItemRequest("Whey protein 1kg", "Suplementos", 4, 5, "KG"));

        assertEquals(4, response.quantity());
        assertTrue(response.lowStock());
        assertEquals(4, item.getQuantity());
    }

    @Test
    @DisplayName("S4: update unknown item -> 404")
    void updateUnknownItem() {
        when(itemRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().updateItem(99L,
                new UpdateInventoryItemRequest("X", "Y", 1, 1, "UN")));
    }

    @Test
    @DisplayName("S4: INBOUND increases stock and records the movement")
    void inboundIncreasesStock() {
        InventoryItem item = item(1L, 5, 10);
        when(itemRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));
        when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(inv -> {
            InventoryMovement m = inv.getArgument(0);
            m.setId(900L);
            return m;
        });

        InventoryMovementResponse response = service().registerMovement(1L,
                new InventoryMovementRequest("INBOUND", 40, "Compra proveedor"));

        assertEquals(900L, response.id());
        assertEquals("INBOUND", response.type());
        assertEquals(40, response.quantity());
        assertEquals(45, item.getQuantity());
        verify(itemRepository).save(item);
    }

    @Test
    @DisplayName("S4: OUTBOUND with quantity > stock -> 409 Gripped business rule")
    void outboundInsufficientStock() {
        InventoryItem item = item(1L, 5, 1);
        when(itemRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service().registerMovement(1L, new InventoryMovementRequest("OUTBOUND", 100, null)));

        assertTrue(ex.getMessage().contains("Insufficient stock"));
        assertEquals(5, item.getQuantity());
        verify(movementRepository, never()).save(any());
    }

    @Test
    @DisplayName("S4: OUTBOUND valid decrements stock")
    void outboundDecreasesStock() {
        InventoryItem item = item(1L, 40, 5);
        when(itemRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));
        when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(inv -> {
            InventoryMovement m = inv.getArgument(0);
            m.setId(901L);
            return m;
        });

        service().registerMovement(1L, new InventoryMovementRequest("outbound", 10, "Uso en clase"));

        assertEquals(30, item.getQuantity());
    }

    @Test
    @DisplayName("S4: invalid movement type -> 400 with allowed list")
    void invalidMovementType() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().registerMovement(1L, new InventoryMovementRequest("STOLEN", 1, null)));
        assertTrue(ex.getMessage().contains("INBOUND, OUTBOUND"));
        verify(itemRepository, never()).findByIdForUpdate(any());
    }

    @Test
    @DisplayName("S4: movement on unknown item -> 404")
    void movementUnknownItem() {
        when(itemRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service().registerMovement(99L, new InventoryMovementRequest("INBOUND", 1, null)));
    }

    @Test
    @DisplayName("S4: getItemById unknown -> 404")
    void getItemUnknown() {
        when(itemRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().getItemById(99L));
    }
}