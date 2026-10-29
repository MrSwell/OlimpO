package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import server.olimpo.entity.TrainerSchedule;

import java.util.List;

public interface TrainerScheduleRepository extends JpaRepository<TrainerSchedule, Long> {

    List<TrainerSchedule> findByTrainerIdOrderByDayOfWeekAscStartTimeAsc(Long trainerId);

    boolean existsByTrainerId(Long trainerId);
}
