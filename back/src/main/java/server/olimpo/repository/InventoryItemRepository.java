package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import server.olimpo.entity.InventoryItem;

import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    /** Items at or below their minimum stock threshold. */
    @Query("SELECT i FROM InventoryItem i WHERE i.quantity <= i.minStock")
    List<InventoryItem> findLowStockItems();
}
