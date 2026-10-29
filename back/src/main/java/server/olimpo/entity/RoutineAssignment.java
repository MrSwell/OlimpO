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

import java.time.LocalDate;

@Entity
@Table(name = "routine_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoutineAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "routine_id", nullable = false)
    private Long routineId;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "assignment_date", nullable = false)
    private LocalDate assignmentDate;

    /** ACTIVE, COMPLETED or CANCELLED. */
    @Column(nullable = false, length = 20)
    private String status;
}
