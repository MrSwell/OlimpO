package server.olimpo.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import server.olimpo.dto.request.CreateClientRequest;
import server.olimpo.dto.response.ClientResponse;
import server.olimpo.entity.Client;
import server.olimpo.entity.User;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.ClientRepository;
import server.olimpo.repository.UserRepository;
import server.olimpo.service.ClientService;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private ClientService service() {
        return new ClientService(clientRepository, userRepository, passwordEncoder);
    }

    private Authentication auth(String email, String... roles) {
        var authorities = Arrays.stream(roles)
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .toList();
        return new UsernamePasswordAuthenticationToken(email, null, authorities);
    }

    private CreateClientRequest request(String email, String sex) {
        return new CreateClientRequest(email, "cli123", "Sofia", "Mendez",
                "3110000001", "1039555888", LocalDate.of(1995, 5, 20), sex, "Definicion");
    }

    @Test
    @DisplayName("S3: creates user + client profile and assigns CLIENT role")
    void createClientSuccess() {
        when(userRepository.existsByEmail("cliente3.test@olimpo.com")).thenReturn(false);
        when(passwordEncoder.encode("cli123")).thenReturn("BCRYPT-CLI");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(5L);
            return u;
        });
        when(userRepository.findRoleIdByName("CLIENT")).thenReturn(Optional.of(5));
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> {
            Client c = inv.getArgument(0);
            c.setId(7L);
            return c;
        });

        ClientResponse response = service().createClient(request("  Cliente3.Test@OLIMPO.com  ", "f"));

        assertEquals(7L, response.id());
        assertEquals(5L, response.userId());
        assertEquals("cliente3.test@olimpo.com", response.email());
        assertEquals("F", response.sex());
        assertEquals("Sofia", response.firstName());
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("BCRYPT-CLI", userCaptor.getValue().getPasswordHash());
        verify(userRepository).insertUserRole(5L, 5);
    }

    @Test
    @DisplayName("S3: duplicate email -> 409 BusinessException")
    void duplicateEmailRejected() {
        when(userRepository.existsByEmail("cliente3.test@olimpo.com")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service().createClient(request("cliente3.test@olimpo.com", "F")));

        assertTrue(ex.getMessage().contains("already exists"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("S3: sex other than M/F -> 400 IllegalArgumentException")
    void invalidSexRejected() {
        when(userRepository.existsByEmail("cliente3.test@olimpo.com")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().createClient(request("cliente3.test@olimpo.com", "X")));

        assertTrue(ex.getMessage().contains("Sex must be"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("S3: unknown client -> 404 ResourceNotFoundException")
    void getClientUnknown() {
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().getClientById(99L));
    }

    @Test
    @DisplayName("S3: joins client with its user to build the response")
    void getClientByIdJoinsUser() {
        Client client = Client.builder().id(7L).userId(5L).documentNumber("1039555888").build();
        User user = User.builder().id(5L).email("cliente1@olimpo.com")
                .firstName("Luis").lastName("Perez").status("ACTIVE").build();
        when(clientRepository.findById(7L)).thenReturn(Optional.of(client));
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        ClientResponse response = service().getClientById(7L);

        assertEquals("cliente1@olimpo.com", response.email());
        assertEquals("Luis", response.firstName());
        assertEquals("ACTIVE", response.status());
    }

    @Test
    @DisplayName("S3: staff (ADMIN/RECEPCIONIST) may access any client without lookup")
    void staffCanAccessAnyClient() {
        service().assertCanAccessClient(123L, auth("admin@olimpo.com", "ADMIN"));
        service().assertCanAccessClient(123L, auth("recepcionista@olimpo.com", "RECEPCIONIST"));
    }

    @Test
    @DisplayName("S3: CLIENT viewing another client's data -> 403 AccessDeniedException")
    void clientCannotAccessOtherClient() {
        User user = User.builder().id(5L).email("cliente1@olimpo.com").build();
        Client own = Client.builder().id(7L).userId(5L).build();
        when(userRepository.findByEmail("cliente1@olimpo.com")).thenReturn(Optional.of(user));
        when(clientRepository.findByUserId(5L)).thenReturn(Optional.of(own));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> service().assertCanAccessClient(8L, auth("cliente1@olimpo.com", "CLIENT")));

        assertTrue(ex.getMessage().contains("own data"));
    }

    @Test
    @DisplayName("S3: CLIENT may access its own client id")
    void clientCanAccessOwnClient() {
        User user = User.builder().id(5L).email("cliente1@olimpo.com").build();
        Client own = Client.builder().id(7L).userId(5L).build();
        when(userRepository.findByEmail("cliente1@olimpo.com")).thenReturn(Optional.of(user));
        when(clientRepository.findByUserId(5L)).thenReturn(Optional.of(own));

        service().assertCanAccessClient(7L, auth("cliente1@olimpo.com", "CLIENT"));
    }

    @Test
    @DisplayName("S3: resolveOwnClientId maps authenticated user to its client profile")
    void resolveOwnClientId() {
        User user = User.builder().id(5L).email("cliente1@olimpo.com").build();
        Client own = Client.builder().id(7L).userId(5L).build();
        when(userRepository.findByEmail("cliente1@olimpo.com")).thenReturn(Optional.of(user));
        when(clientRepository.findByUserId(5L)).thenReturn(Optional.of(own));

        assertEquals(7L, service().resolveOwnClientId(auth("cliente1@olimpo.com", "CLIENT")));
    }

    @Test
    @DisplayName("S3: role helpers detect null, staff and client authorities")
    void roleHelpers() {
        assertFalse(service().isStaffRole(null));
        assertFalse(service().isClientRole(null));
        assertTrue(service().isStaffRole(auth("a@a.com", "ADMIN")));
        assertTrue(service().isClientRole(auth("a@a.com", "CLIENT")));
        assertFalse(service().isClientRole(auth("a@a.com", "TRAINER")));
        assertFalse(service().isStaffRole(auth("a@a.com", "TRAINER")));
    }

    @Test
    @DisplayName("S3: access to a user without client profile -> 404")
    void resolveOwnClientIdWithoutProfile() {
        User user = User.builder().id(9L).email("sinperfil@olimpo.com").build();
        when(userRepository.findByEmail("sinperfil@olimpo.com")).thenReturn(Optional.of(user));
        when(clientRepository.findByUserId(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service().resolveOwnClientId(auth("sinperfil@olimpo.com", "CLIENT")));
    }
}