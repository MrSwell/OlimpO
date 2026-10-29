package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import server.olimpo.entity.Machine;

import java.util.List;

public interface MachineRepository extends JpaRepository<Machine, Long> {

    boolean existsBySerialNumber(String serialNumber);

    List<Machine> findByStatus(String status);

    java.util.Optional<Machine> findBySerialNumber(String serialNumber);
}
