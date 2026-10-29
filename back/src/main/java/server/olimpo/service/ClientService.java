package server.olimpo.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.dto.request.CreateClientRequest;
import server.olimpo.dto.response.ClientResponse;
import server.olimpo.dto.response.PageResponse;
import server.olimpo.entity.Client;
import server.olimpo.entity.User;
import server.olimpo.enums.UserStatus;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.ClientRepository;
import server.olimpo.repository.UserRepository;
import server.olimpo.util.Pagination;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ClientService(ClientRepository clientRepository,
                         UserRepository userRepository,
                         PasswordEncoder passwordEncoder) {
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public ClientResponse createClient(CreateClientRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("A user with this email already exists: " + email);
        }
        String sex = request.sex();
        if (sex != null && !"M".equalsIgnoreCase(sex) && !"F".equalsIgnoreCase(sex)) {
            throw new IllegalArgumentException("Sex must be 'M' or 'F'");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .phone(request.phone())
                .status(UserStatus.ACTIVE.name())
                .build();
        user = userRepository.save(user);

        Integer clientRoleId = userRepository.findRoleIdByName("CLIENT")
                .orElseThrow(() -> new BusinessException("CLIENT role not found in database"));
        userRepository.insertUserRole(user.getId(), clientRoleId);

        Client client = Client.builder()
                .userId(user.getId())
                .documentNumber(request.documentNumber().trim())
                .birthDate(request.birthDate())
                .sex(sex != null ? sex.toUpperCase() : null)
                .fitnessGoal(request.fitnessGoal())
                .build();
        clientRepository.save(client);

        return toResponse(client, user);
    }

    @Transactional(readOnly = true)
    public PageResponse<ClientResponse> getAllClients(String search, Pageable pageable) {
        var clients = clientRepository.searchClients(Pagination.normalizeSearch(search), pageable);
        List<Long> userIds = clients.getContent().stream().map(Client::getUserId).toList();
        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));
        return PageResponse.from(clients.map(client -> {
            User user = usersById.get(client.getUserId());
            if (user == null) {
                throw new ResourceNotFoundException("User not found for client id: " + client.getId());
            }
            return toResponse(client, user);
        }));

    }

    @Transactional(readOnly = true)
    public ClientResponse getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));
        User user = userRepository.findById(client.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found for client id: " + id));
        return toResponse(client, user);
    }

    public boolean isStaffRole(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_RECEPCIONIST"));
    }

    public boolean isClientRole(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"));
    }

    @Transactional(readOnly = true)
    public Long resolveOwnClientId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authentication.getName()));
        Client client = clientRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No client profile found for this user"));
        return client.getId();
    }

    /** Staff (ADMIN/RECEPCIONIST) can access any client; CLIENT can only access its own profile. */
    public void assertCanAccessClient(Long clientId, Authentication authentication) {
        if (isStaffRole(authentication)) {
            return;
        }
        Long ownClientId = resolveOwnClientId(authentication);
        if (!ownClientId.equals(clientId)) {
            throw new AccessDeniedException("Clients can only access their own data");
        }
    }

    private ClientResponse toResponse(Client client, User user) {
        return new ClientResponse(client.getId(), client.getUserId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), user.getPhone(),
                client.getDocumentNumber(), client.getBirthDate(), client.getSex(), client.getFitnessGoal(),
                user.getStatus());
    }
}
