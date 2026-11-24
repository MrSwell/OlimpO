package server.olimpo.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import server.olimpo.entity.Trainer;

import java.util.Optional;

public interface TrainerRepository extends JpaRepository<Trainer, Long> {

    Optional<Trainer> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("""
            SELECT t FROM Trainer t JOIN User u ON u.id = t.userId
            WHERE :search IS NULL
               OR LOWER(u.firstName) LIKE CONCAT('%', :search, '%')
               OR LOWER(u.lastName) LIKE CONCAT('%', :search, '%')
               OR LOWER(CONCAT(CONCAT(u.firstName, ' '), u.lastName)) LIKE CONCAT('%', :search, '%')
               OR LOWER(t.specialty) LIKE CONCAT('%', :search, '%')
            """)
    Page<Trainer> searchTrainers(@Param("search") String search, Pageable pageable);

    /**
     * Locks the trainer row for the rest of the transaction (SELECT ... FOR UPDATE).
     * Used by weekly-schedule replacement so concurrent replaces serialize instead of
     * racing on delete+insert (which would surface as a stale-row server error).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Trainer t WHERE t.id = :id")
    Optional<Trainer> findByIdForUpdate(@Param("id") Long id);
}