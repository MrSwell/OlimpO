package server.olimpo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import server.olimpo.dto.request.CreateMembershipRequest;
import server.olimpo.dto.request.RenewMembershipRequest;
import server.olimpo.dto.response.MembershipResponse;
import server.olimpo.service.MembershipService;

@RestController
@RequestMapping("/api/v1/memberships")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST')")
    public MembershipResponse createMembership(@Valid @RequestBody CreateMembershipRequest request) {
        return membershipService.createMembership(request);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST', 'CLIENT')")
    public MembershipResponse getActiveMembership(
            @RequestParam(required = false) Long clientId,
            Authentication authentication) {
        return membershipService.getActiveMembership(clientId, authentication);
    }

    @PatchMapping("/{id}/renew")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONIST')")
    public MembershipResponse renewMembership(@PathVariable Long id, @Valid @RequestBody RenewMembershipRequest request) {
        return membershipService.renewMembership(id, request);
    }
}
