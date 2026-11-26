package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import server.olimpo.entity.RoutineExercise;

import java.util.Collection;
import java.util.List;

public interface RoutineExerciseRepository extends JpaRepository<RoutineExercise, Long> {

    List<RoutineExercise> findByRoutineIdOrderByPositionAsc(Long routineId);

    List<RoutineExercise> findByRoutineIdInOrderByPositionAsc(Collection<Long> routineIds);

    void deleteByRoutineId(Long routineId);
}
