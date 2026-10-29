package server.olimpo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import server.olimpo.dto.request.CreateInventoryItemRequest;
import server.olimpo.dto.request.InventoryMovementRequest;
import server.olimpo.dto.request.UpdateInventoryItemRequest;
import server.olimpo.dto.response.InventoryItemResponse;
import server.olimpo.dto.response.InventoryMovementResponse;
import server.olimpo.service.InventoryService;

import java.util.List;

/**
 * Inventory management. Roles: ADMIN, TRAINER_MANAGER, TRAINER.
 * (RECEPCIONIST excluded by design: when the receptionist is absent,
 * trainers and the trainer manager run the inventory.)
 */
@RestController
@RequestMapping("/api/v1/inventory/items")
@PreAuthorize("hasAnyRole('ADMIN', 'TRAINER_MANAGER', 'TRAINER')")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItemResponse createItem(@Valid @RequestBody CreateInventoryItemRequest request) {
        return inventoryService.createItem(request);
    }

    @GetMapping
    public List<InventoryItemResponse> getAllItems() {
        return inventoryService.getAllItems();
    }

    @GetMapping("/low-stock")
    public List<InventoryItemResponse> getLowStockItems() {
        return inventoryService.getLowStockItems();
    }

    @GetMapping("/{id}")
    public InventoryItemResponse getItemById(@PathVariable Long id) {
        return inventoryService.getItemById(id);
    }

    @PatchMapping("/{id}")
    public InventoryItemResponse updateItem(@PathVariable Long id, @Valid @RequestBody UpdateInventoryItemRequest request) {
        return inventoryService.updateItem(id, request);
    }

    @PostMapping("/{id}/movements")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryMovementResponse registerMovement(@PathVariable Long id,
                                                      @Valid @RequestBody InventoryMovementRequest request) {
        return inventoryService.registerMovement(id, request);
    }

    @GetMapping("/{id}/movements")
    public List<InventoryMovementResponse> getMovementHistory(@PathVariable Long id) {
        return inventoryService.getMovementHistory(id);
    }
}
