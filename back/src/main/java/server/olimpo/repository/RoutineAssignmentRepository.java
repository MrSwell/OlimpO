package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import server.olimpo.entity.RoutineAssignment;

import java.util.List;

public interface RoutineAssignmentRepository extends JpaRepository<RoutineAssignment, Long> {

    List<RoutineAssignment> findByRoutineIdOrderByAssignmentDateDesc(Long routineId);

    List<RoutineAssignment> findByClientIdOrderByAssignmentDateDesc(Long clientId);
}
