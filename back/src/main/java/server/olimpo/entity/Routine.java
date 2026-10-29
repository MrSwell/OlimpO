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

import java.math.BigDecimal;

@Entity
@Table(name = "routines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Routine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** NULL for GENERAL routines; set for CUSTOM routines. */
    @Column(name = "trainer_id")
    private Long trainerId;

    @Column(nullable = false, length = 150)
    private String name;

    /** GENERAL or CUSTOM. */
    @Column(nullable = false, length = 20)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Only for CUSTOM routines. */
    @Column(precision = 10, scale = 2)
    private BigDecimal price;
}
