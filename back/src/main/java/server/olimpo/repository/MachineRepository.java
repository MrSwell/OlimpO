package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.olimpo.entity.Machine;

public interface MachineRepository extends JpaRepository<Machine, Long> {

    boolean existsBySerialNumber(String serialNumber);

    java.util.Optional<Machine> findBySerialNumber(String serialNumber);

    @Query("""
            SELECT m FROM Machine m
            WHERE (:status IS NULL OR m.status = :status)
              AND (:search IS NULL
                   OR LOWER(m.name) LIKE CONCAT('%', :search, '%')
                   OR LOWER(m.brand) LIKE CONCAT('%', :search, '%')
                   OR LOWER(m.model) LIKE CONCAT('%', :search, '%')
                   OR LOWER(m.serialNumber) LIKE CONCAT('%', :search, '%'))
            """)
    Page<Machine> searchMachines(@Param("status") String status,
                                 @Param("search") String search,
                                 Pageable pageable);
}
