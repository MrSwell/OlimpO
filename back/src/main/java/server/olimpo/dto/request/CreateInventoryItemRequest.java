package server.olimpo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateInventoryItemRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 150, message = "Name cannot exceed 150 characters")
        String name,

        @Size(max = 100, message = "Category cannot exceed 100 characters")
        String category,

        Integer quantity,

        Integer minStock,

        @Size(max = 20, message = "Unit cannot exceed 20 characters")
        String unit) {
}
