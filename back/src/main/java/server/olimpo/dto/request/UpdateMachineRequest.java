package server.olimpo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateMachineRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 150, message = "Name cannot exceed 150 characters")
        String name,

        @Size(max = 100, message = "Brand cannot exceed 100 characters")
        String brand,

        @Size(max = 100, message = "Model cannot exceed 100 characters")
        String model,

        @Size(max = 100, message = "Serial number cannot exceed 100 characters")
        String serialNumber,

        @NotBlank(message = "Status is required")
        String status) {
}
