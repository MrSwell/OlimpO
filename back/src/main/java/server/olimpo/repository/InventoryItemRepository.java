package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.olimpo.entity.InventoryItem;

import jakarta.persistence.LockModeType;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    /** Items at or below their minimum stock threshold. */
    @Query("""
            SELECT i FROM InventoryItem i
            WHERE (:lowStockOnly = false OR i.quantity <= i.minStock)
              AND (:search IS NULL
                   OR LOWER(i.name) LIKE CONCAT('%', :search, '%')
                   OR LOWER(i.category) LIKE CONCAT('%', :search, '%')
                   OR LOWER(i.unit) LIKE CONCAT('%', :search, '%'))
            """)
    Page<InventoryItem> searchItems(@Param("lowStockOnly") boolean lowStockOnly,
                                    @Param("search") String search,
                                    Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryItem i WHERE i.id = :id")
    java.util.Optional<InventoryItem> findByIdForUpdate(@Param("id") Long id);
}
