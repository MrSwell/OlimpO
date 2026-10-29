package server.olimpo.dto.response;

import java.time.LocalDateTime;

public record InventoryMovementResponse(
        Long id,
        Long itemId,
        String type,
        Integer quantity,
        String observation,
        LocalDateTime movementDate) {
}
