package server.olimpo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "routine_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoutineExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "routine_id", nullable = false)
    private Long routineId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "sets_count")
    private Integer sets;

    @Column(length = 50)
    private String reps;

    @Column(name = "rest_seconds")
    private Integer restSeconds;

    @Column(length = 255)
    private String notes;

    /** Display order inside the routine plan. */
    @Column(nullable = false)
    private Integer position;
}
