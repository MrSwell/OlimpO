package server.olimpo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.entity.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query(value = """
            SELECT r.name
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = :userId
            """, nativeQuery = true)
    List<String> findRoleNamesByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT id FROM roles WHERE name = :name", nativeQuery = true)
    Optional<Integer> findRoleIdByName(@Param("name") String name);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM user_roles WHERE user_id = :userId", nativeQuery = true)
    void deleteUserRoles(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)", nativeQuery = true)
    void insertUserRole(@Param("userId") Long userId, @Param("roleId") Integer roleId);
}
