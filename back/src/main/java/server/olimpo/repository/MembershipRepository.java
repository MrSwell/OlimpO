package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import server.olimpo.entity.Membership;

import java.util.List;
import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {

    Optional<Membership> findByClientIdAndStatus(Long clientId, String status);

    List<Membership> findByClientIdOrderByCreatedAtDesc(Long clientId);
}
