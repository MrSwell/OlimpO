package server.olimpo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import server.olimpo.dto.request.CreateClientRequest;
import server.olimpo.dto.response.ClientResponse;
import server.olimpo.dto.response.MembershipResponse;
import server.olimpo.dto.response.PageResponse;
import server.olimpo.dto.response.PaymentResponse;
import server.olimpo.service.ClientService;
import server.olimpo.service.MembershipService;
import server.olimpo.service.PaymentService;
import server.olimpo.util.Pagination;

@RestController
@RequestMapping("/api/v1/clients")
public class ClientController {

    private final ClientService clientService;
    private final MembershipService membershipService;
    private final PaymentService paymentService;

    public ClientController(ClientService clientService, MembershipService membershipService,
                            PaymentService paymentService) {
        this.clientService = clientService;
        this.membershipService = membershipService;
        this.paymentService = paymentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST')")
    public ClientResponse createClient(@Valid @RequestBody CreateClientRequest request) {
        return clientService.createClient(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST')")
    public PageResponse<ClientResponse> getAllClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return clientService.getAllClients(search,
                Pagination.request(page, size, Sort.by(Sort.Order.asc("id"))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST', 'CLIENT')")
    public ClientResponse getClientById(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        clientService.assertCanAccessClient(id, authentication);
        return clientService.getClientById(id);
    }

    @GetMapping("/{id}/memberships")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST', 'CLIENT')")
    public PageResponse<MembershipResponse> getClientMemberships(
            @PathVariable Long id,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return membershipService.getMembershipsByClient(id, search,
                Pagination.request(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))),
                authentication);
    }

    @GetMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST', 'CLIENT')")
    public PageResponse<PaymentResponse> getClientPayments(
            @PathVariable Long id,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        clientService.assertCanAccessClient(id, authentication);
        return paymentService.getPaymentsByClient(id, search,
                Pagination.request(page, size, Sort.by(Sort.Order.desc("paymentDate"), Sort.Order.desc("id"))));
    }
}
