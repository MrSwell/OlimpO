package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.olimpo.entity.Client;

import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {

    Optional<Client> findByUserId(Long userId);

    @Query("""
            SELECT c FROM Client c JOIN User u ON u.id = c.userId
            WHERE :search IS NULL
               OR LOWER(c.documentNumber) LIKE CONCAT('%', :search, '%')
               OR LOWER(c.fitnessGoal) LIKE CONCAT('%', :search, '%')
               OR LOWER(u.email) LIKE CONCAT('%', :search, '%')
               OR LOWER(u.firstName) LIKE CONCAT('%', :search, '%')
               OR LOWER(u.lastName) LIKE CONCAT('%', :search, '%')
               OR LOWER(CONCAT(CONCAT(u.firstName, ' '), u.lastName)) LIKE CONCAT('%', :search, '%')
               OR LOWER(u.phone) LIKE CONCAT('%', :search, '%')
            """)
    Page<Client> searchClients(@Param("search") String search, Pageable pageable);
}
