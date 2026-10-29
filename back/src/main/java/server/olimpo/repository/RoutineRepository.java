package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import server.olimpo.entity.Routine;

import java.util.List;

public interface RoutineRepository extends JpaRepository<Routine, Long> {

    List<Routine> findByType(String type);
}
