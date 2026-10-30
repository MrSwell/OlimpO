package server.olimpo.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.olimpo.entity.Membership;

import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {

    Optional<Membership> findByClientIdAndStatus(Long clientId, String status);

    /**
     * Locks the membership row for the rest of the transaction (SELECT ... FOR UPDATE):
     * serializes concurrent renewals so a second one extends from the first's new
     * endDate instead of losing its extension (read-modify-write race).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Membership m WHERE m.id = :id")
    Optional<Membership> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT m FROM Membership m
            WHERE m.clientId = :clientId
              AND (:search IS NULL
                   OR LOWER(m.type) LIKE CONCAT('%', :search, '%')
                   OR LOWER(m.status) LIKE CONCAT('%', :search, '%'))
            """)
    Page<Membership> searchByClientId(@Param("clientId") Long clientId,
                                      @Param("search") String search,
                                      Pageable pageable);
}
