package server.olimpo.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InventoryMovementRequest(
        @NotBlank(message = "Type is required")
        String type,

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        Integer quantity,

        @Size(max = 255, message = "Observation cannot exceed 255 characters")
        String observation) {
}
