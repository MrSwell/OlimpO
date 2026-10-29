package server.olimpo.dto.response;

public record MachineResponse(
        Long id,
        String name,
        String brand,
        String model,
        String serialNumber,
        String status) {
}
