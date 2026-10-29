package server.olimpo.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateInventoryItemRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 150, message = "Name cannot exceed 150 characters")
        String name,

        @Size(max = 100, message = "Category cannot exceed 100 characters")
        String category,

        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity cannot be negative")
        Integer quantity,

        @NotNull(message = "MinStock is required")
        @Min(value = 0, message = "MinStock cannot be negative")
        Integer minStock,

        @Size(max = 20, message = "Unit cannot exceed 20 characters")
        String unit) {
}
