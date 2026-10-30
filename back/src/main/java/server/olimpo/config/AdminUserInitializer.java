package server.olimpo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import server.olimpo.entity.User;
import server.olimpo.repository.UserRepository;

/**
 * Seeds the initial admin account for development/testing purposes.
 * TODO: remove or guard behind a profile before production.
 */
@Component
public class AdminUserInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        String email = "admin@olimpo.com";

        if (userRepository.existsByEmail(email)) {
            return;
        }

        User admin = User.builder()
                .email(email)
                // Dev-only seed credential; documented in AGENTS.md/README. The account is
                // created only when missing, and the password lives in committed dev docs.
                .passwordHash(passwordEncoder.encode("admin123"))
                .firstName("Olimpo")
                .lastName("Admin")
                .phone("+57 000 000 0000")
                .status("ACTIVE")
                .build();
        admin = userRepository.save(admin);
        userRepository.insertUserRole(admin.getId(), adminRoleId());

        log.info("[Seed] Admin user created: {}", email);
    }

    /** Looks up the ADMIN role by name instead of relying on a hardcoded id. */
    private Integer adminRoleId() {
        return userRepository.findRoleIdByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException(
                        "ADMIN role missing from the roles table; seed cannot proceed"));
    }
}
