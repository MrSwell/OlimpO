package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.olimpo.entity.Membership;

import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {

    Optional<Membership> findByClientIdAndStatus(Long clientId, String status);

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
