package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.olimpo.entity.RoutineAssignment;

public interface RoutineAssignmentRepository extends JpaRepository<RoutineAssignment, Long> {

    @Query("""
            SELECT a FROM RoutineAssignment a
            JOIN Routine r ON r.id = a.routineId
            JOIN Client c ON c.id = a.clientId
            JOIN User u ON u.id = c.userId
            WHERE (:routineId IS NULL OR a.routineId = :routineId)
              AND (:clientId IS NULL OR a.clientId = :clientId)
              AND (:search IS NULL
                   OR LOWER(a.status) LIKE CONCAT('%', :search, '%')
                   OR LOWER(r.name) LIKE CONCAT('%', :search, '%')
                   OR LOWER(u.firstName) LIKE CONCAT('%', :search, '%')
                   OR LOWER(u.lastName) LIKE CONCAT('%', :search, '%')
                   OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE CONCAT('%', :search, '%'))
            """)
    Page<RoutineAssignment> searchAssignments(@Param("routineId") Long routineId,
                                               @Param("clientId") Long clientId,
                                               @Param("search") String search,
                                               Pageable pageable);
}
