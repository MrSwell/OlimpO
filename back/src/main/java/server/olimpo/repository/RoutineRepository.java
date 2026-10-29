package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.olimpo.entity.Routine;

public interface RoutineRepository extends JpaRepository<Routine, Long> {

    @Query("""
            SELECT r FROM Routine r
            WHERE (:type IS NULL OR r.type = :type)
              AND (:search IS NULL
                   OR LOWER(r.name) LIKE CONCAT('%', :search, '%')
                   OR LOWER(r.description) LIKE CONCAT('%', :search, '%'))
            """)
    Page<Routine> searchRoutines(@Param("type") String type,
                                 @Param("search") String search,
                                 Pageable pageable);
}
