package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.olimpo.entity.InventoryMovement;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    @Query("""
            SELECT m FROM InventoryMovement m
            WHERE m.itemId = :itemId
              AND (:search IS NULL
                   OR LOWER(m.type) LIKE CONCAT('%', :search, '%')
                   OR LOWER(m.observation) LIKE CONCAT('%', :search, '%'))
            """)
    Page<InventoryMovement> searchByItemId(@Param("itemId") Long itemId,
                                            @Param("search") String search,
                                            Pageable pageable);
}
