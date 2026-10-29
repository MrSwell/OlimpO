package server.olimpo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import server.olimpo.dto.request.CreateClientRequest;
import server.olimpo.dto.response.ClientResponse;
import server.olimpo.service.ClientService;
import server.olimpo.service.MembershipService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clients")
public class ClientController {

    private final ClientService clientService;
    private final MembershipService membershipService;

    public ClientController(ClientService clientService, MembershipService membershipService) {
        this.clientService = clientService;
        this.membershipService = membershipService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST')")
    public ClientResponse createClient(@Valid @RequestBody CreateClientRequest request) {
        return clientService.createClient(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST')")
    public List<ClientResponse> getAllClients() {
        return clientService.getAllClients();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST', 'CLIENT')")
    public ClientResponse getClientById(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        clientService.assertCanAccessClient(id, authentication);
        return clientService.getClientById(id);
    }

    @GetMapping("/{id}/memberships")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST', 'CLIENT')")
    public List<server.olimpo.dto.response.MembershipResponse> getClientMemberships(
            @PathVariable Long id,
            org.springframework.security.core.Authentication authentication) {
        return membershipService.getMembershipsByClient(id, authentication);
    }
}
