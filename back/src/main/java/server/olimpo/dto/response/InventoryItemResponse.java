package server.olimpo.dto.response;

public record InventoryItemResponse(
        Long id,
        String name,
        String category,
        Integer quantity,
        Integer minStock,
        boolean lowStock,
        String unit) {
}
