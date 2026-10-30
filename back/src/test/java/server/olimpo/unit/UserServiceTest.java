package server.olimpo.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import server.olimpo.dto.request.CreateUserRequest;
import server.olimpo.dto.request.UpdateUserRolesRequest;
import server.olimpo.dto.response.UserResponse;
import server.olimpo.entity.Trainer;
import server.olimpo.entity.User;
import server.olimpo.exception.BusinessException;
import server.olimpo.repository.TrainerRepository;
import server.olimpo.repository.UserRepository;
import server.olimpo.service.UserService;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private TrainerRepository trainerRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService service() {
        return new UserService(userRepository, trainerRepository, passwordEncoder);
    }

    private CreateUserRequest request(List<String> roles) {
        return new CreateUserRequest("new@olimpo.com", "secret1", "Nueva", "Persona", "3001112233", roles);
    }

    private Authentication auth(String email, String role) {
        return new UsernamePasswordAuthenticationToken(email, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    private Authentication adminAuth() {
        return auth("admin@olimpo.com", "ADMIN");
    }

    @Test
    @DisplayName("S2: creates user with encoded password and assigned roles")
    void createUserSuccess() {
        when(userRepository.existsByEmail("new@olimpo.com")).thenReturn(false);
        when(passwordEncoder.encode("secret1")).thenReturn("BCRYPT-HASH");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(10L);
            return u;
        });
        when(userRepository.findRoleIdByName("RECEPCIONIST")).thenReturn(Optional.of(2));

        UserResponse response = service().createUser(request(List.of("RECEPCIONIST")), adminAuth());

        assertEquals(10L, response.id());
        assertEquals(List.of("RECEPCIONIST"), response.roles());
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("BCRYPT-HASH", captor.getValue().getPasswordHash());
        verify(userRepository).insertUserRole(10L, 2);
        verify(trainerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Assigning role TRAINER auto-creates the trainer profile")
    void createTrainerUserCreatesProfile() {
        when(userRepository.existsByEmail("new@olimpo.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("H");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(11L);
            return u;
        });
        when(userRepository.findRoleIdByName("TRAINER")).thenReturn(Optional.of(4));
        when(trainerRepository.existsByUserId(11L)).thenReturn(false);
        when(trainerRepository.save(any(Trainer.class))).thenAnswer(inv -> {
            Trainer t = inv.getArgument(0);
            t.setId(3L);
            return t;
        });

        service().createUser(request(List.of("TRAINER")), adminAuth());

        ArgumentCaptor<Trainer> captor = ArgumentCaptor.forClass(Trainer.class);
        verify(trainerRepository).save(captor.capture());
        assertEquals(11L, captor.getValue().getUserId());
    }

    @Test
    @DisplayName("S2: duplicate email -> BusinessException")
    void duplicateEmailRejected() {
        when(userRepository.existsByEmail("new@olimpo.com")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service().createUser(request(List.of("ADMIN")), adminAuth()));

        assertTrue(ex.getMessage().contains("already exists"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("S2: role CLIENT cannot be assigned via user management")
    void clientRoleRejected() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().createUser(request(List.of("CLIENT")), adminAuth()));
        assertTrue(ex.getMessage().contains("CLIENT cannot be assigned"));
    }

    @Test
    @DisplayName("S2: only ADMIN may assign the ADMIN role (privilege-escalation guard)")
    void nonAdminCannotAssignAdminRole() {
        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> service().createUser(request(List.of("ADMIN")),
                        auth("recepcionista@olimpo.com", "RECEPCIONIST")));

        assertTrue(ex.getMessage().contains("Only ADMIN"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("S2: ADMIN can mint an ADMIN account")
    void adminCanAssignAdminRole() {
        when(userRepository.existsByEmail("new@olimpo.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("H");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(12L);
            return u;
        });
        when(userRepository.findRoleIdByName("ADMIN")).thenReturn(Optional.of(1));

        UserResponse response = service().createUser(request(List.of("ADMIN")), adminAuth());

        assertEquals(12L, response.id());
        assertEquals(List.of("ADMIN"), response.roles());
        verify(userRepository).insertUserRole(12L, 1);
    }

    @Test
    @DisplayName("Invalid role and duplicated role are rejected")
    void invalidAndDuplicateRolesRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> service().createUser(request(List.of("COACH")), adminAuth()));
        assertThrows(IllegalArgumentException.class,
                () -> service().createUser(request(List.of("ADMIN", "admin")), adminAuth()));
        assertThrows(IllegalArgumentException.class,
                () -> service().createUser(request(List.of()), adminAuth()));
    }

    @Test
    @DisplayName("updateUserRoles replaces all roles atomically (delete then insert)")
    void updateUserRolesReplaces() {
        User user = User.builder().id(3L).email("trainer@olimpo.com").build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        when(userRepository.findRoleIdByName("TRAINER")).thenReturn(Optional.of(4));
        when(userRepository.findRoleIdByName("TRAINER_MANAGER")).thenReturn(Optional.of(3));

        UserResponse response = service().updateUserRoles(3L,
                new UpdateUserRolesRequest(List.of("TRAINER", "TRAINER_MANAGER")));

        InOrder inOrder = inOrder(userRepository);
        inOrder.verify(userRepository).deleteUserRoles(3L);
        inOrder.verify(userRepository).insertUserRole(eq(3L), eq(4));
        inOrder.verify(userRepository).insertUserRole(eq(3L), eq(3));
        assertEquals(List.of("TRAINER", "TRAINER_MANAGER"), response.roles());
    }

    @Test
    @DisplayName("updateUserRoles on unknown user -> 404 ResourceNotFoundException")
    void updateUserRolesUnknownUser() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(server.olimpo.exception.ResourceNotFoundException.class,
                () -> service().updateUserRoles(99L, new UpdateUserRolesRequest(List.of("ADMIN"))));
    }

    @Test
    @DisplayName("getAllUsers maps grouped role names per user (projection join)")
    void getAllUsersMapsRoles() {
        User first = User.builder().id(1L).email("a@olimpo.com").build();
        User second = User.builder().id(2L).email("b@olimpo.com").build();
        when(userRepository.searchUsers(any(), any()))
                .thenReturn(new PageImpl<>(List.of(first, second)));
        UserRepository.UserRoleNameProjection adminPair = mock(UserRepository.UserRoleNameProjection.class);
        when(adminPair.getUserId()).thenReturn(1L);
        when(adminPair.getRoleName()).thenReturn("ADMIN");
        UserRepository.UserRoleNameProjection clientPair = mock(UserRepository.UserRoleNameProjection.class);
        when(clientPair.getUserId()).thenReturn(2L);
        when(clientPair.getRoleName()).thenReturn("CLIENT");
        when(userRepository.findRoleNamesByUserIds(anyCollection())).thenReturn(List.of(adminPair, clientPair));

        var page = service().getAllUsers(null, PageRequest.of(0, 10));

        assertEquals(2, page.content().size());
        assertEquals(List.of("ADMIN"), page.content().get(0).roles());
        assertEquals(List.of("CLIENT"), page.content().get(1).roles());
    }
}