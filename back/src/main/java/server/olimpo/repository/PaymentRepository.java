package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.olimpo.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("""
            SELECT p FROM Payment p
            WHERE p.clientId = :clientId
              AND (:search IS NULL
                   OR LOWER(p.reference) LIKE CONCAT('%', :search, '%')
                   OR LOWER(p.method) LIKE CONCAT('%', :search, '%'))
            """)
    Page<Payment> searchByClientId(@Param("clientId") Long clientId,
                                   @Param("search") String search,
                                   Pageable pageable);
}
