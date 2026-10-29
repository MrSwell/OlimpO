package server.olimpo.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.dto.request.CreateInventoryItemRequest;
import server.olimpo.dto.request.InventoryMovementRequest;
import server.olimpo.dto.request.UpdateInventoryItemRequest;
import server.olimpo.dto.response.InventoryItemResponse;
import server.olimpo.dto.response.InventoryMovementResponse;
import server.olimpo.entity.InventoryItem;
import server.olimpo.entity.InventoryMovement;
import server.olimpo.enums.InventoryMovementType;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.InventoryItemRepository;
import server.olimpo.repository.InventoryMovementRepository;

import java.util.List;

@Service
public class InventoryService {

    private final InventoryItemRepository itemRepository;
    private final InventoryMovementRepository movementRepository;

    public InventoryService(InventoryItemRepository itemRepository,
                            InventoryMovementRepository movementRepository) {
        this.itemRepository = itemRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public InventoryItemResponse createItem(CreateInventoryItemRequest request) {
        Integer quantity = request.quantity() == null ? 0 : request.quantity();
        Integer minStock = request.minStock() == null ? 5 : request.minStock();
        validateQuantities(quantity, minStock);

        InventoryItem item = InventoryItem.builder()
                .name(request.name().trim())
                .category(request.category())
                .quantity(quantity)
                .minStock(minStock)
                .unit(request.unit())
                .build();
        return toResponse(itemRepository.save(item));
    }

    @Transactional
    public InventoryItemResponse updateItem(Long id, UpdateInventoryItemRequest request) {
        InventoryItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + id));

        validateQuantities(request.quantity(), request.minStock());
        item.setName(request.name().trim());
        item.setCategory(request.category());
        item.setQuantity(request.quantity());
        item.setMinStock(request.minStock());
        item.setUnit(request.unit());
        return toResponse(itemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getAllItems() {
        return itemRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public InventoryItemResponse getItemById(Long id) {
        return toResponse(getItemEntity(id));
    }

    /** Alert: items at or below their minimum stock threshold. */
    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getLowStockItems() {
        return itemRepository.findLowStockItems().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public InventoryMovementResponse registerMovement(Long itemId, InventoryMovementRequest request) {
        String type = validateType(request.type());
        InventoryItem item = getItemEntity(itemId);

        if (InventoryMovementType.OUTBOUND.name().equals(type)) {
            if (item.getQuantity() < request.quantity()) {
                throw new BusinessException("Insufficient stock for item '" + item.getName()
                        + "'. Available: " + item.getQuantity() + ", requested: " + request.quantity());
            }
            item.setQuantity(item.getQuantity() - request.quantity());
        } else {
            item.setQuantity(item.getQuantity() + request.quantity());
        }
        itemRepository.save(item);

        InventoryMovement movement = InventoryMovement.builder()
                .itemId(itemId)
                .type(type)
                .quantity(request.quantity())
                .observation(request.observation())
                .build();
        return toResponse(movementRepository.save(movement));
    }

    @Transactional(readOnly = true)
    public List<InventoryMovementResponse> getMovementHistory(Long itemId) {
        getItemEntity(itemId);
        return movementRepository.findByItemIdOrderByMovementDateDesc(itemId).stream()
                .map(this::toResponse)
                .toList();
    }

    private InventoryItem getItemEntity(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + id));
    }

    private void validateQuantities(Integer quantity, Integer minStock) {
        if (quantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        if (minStock < 0) {
            throw new IllegalArgumentException("MinStock cannot be negative");
        }
    }

    private String validateType(String type) {
        try {
            return InventoryMovementType.valueOf(type.trim().toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid movement type: " + type + ". Allowed: INBOUND, OUTBOUND");
        }
    }

    private InventoryItemResponse toResponse(InventoryItem item) {
        return new InventoryItemResponse(item.getId(), item.getName(), item.getCategory(),
                item.getQuantity(), item.getMinStock(), item.getQuantity() <= item.getMinStock(), item.getUnit());
    }

    private InventoryMovementResponse toResponse(InventoryMovement movement) {
        return new InventoryMovementResponse(movement.getId(), movement.getItemId(), movement.getType(),
                movement.getQuantity(), movement.getObservation(), movement.getMovementDate());
    }
}
