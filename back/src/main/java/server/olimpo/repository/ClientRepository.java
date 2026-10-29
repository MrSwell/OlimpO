package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import server.olimpo.entity.Client;

import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {

    Optional<Client> findByUserId(Long userId);
}
