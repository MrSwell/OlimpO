package server.olimpo.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import server.olimpo.entity.User;
import server.olimpo.repository.UserRepository;

import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        List<String> roleNames = userRepository.findRoleNamesByUserId(user.getId());

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(roleNames.stream()
                        .map(role -> "ROLE_" + role)
                        .toArray(String[]::new))
                .accountLocked(false)
                .disabled(!"ACTIVE".equals(user.getStatus()))
                .build();
    }
}
