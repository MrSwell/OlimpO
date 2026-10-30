package server.olimpo.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.olimpo.entity.Trainer;

import java.util.Optional;

public interface TrainerRepository extends JpaRepository<Trainer, Long> {

    Optional<Trainer> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    /**
     * Locks the trainer row for the rest of the transaction (SELECT ... FOR UPDATE).
     * Used by weekly-schedule replacement so concurrent replaces serialize instead of
     * racing on delete+insert (which would surface as a stale-row server error).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Trainer t WHERE t.id = :id")
    Optional<Trainer> findByIdForUpdate(@Param("id") Long id);
}