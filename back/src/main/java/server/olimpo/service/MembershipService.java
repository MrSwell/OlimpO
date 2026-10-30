package server.olimpo.service;

import org.springframework.security.core.Authentication;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.dto.request.CreateMembershipRequest;
import server.olimpo.dto.request.RenewMembershipRequest;
import server.olimpo.dto.response.MembershipResponse;
import server.olimpo.dto.response.PageResponse;
import server.olimpo.entity.Membership;
import server.olimpo.entity.Payment;
import server.olimpo.enums.MembershipStatus;
import server.olimpo.enums.MembershipType;
import server.olimpo.enums.PaymentMethod;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.ClientRepository;
import server.olimpo.repository.MembershipRepository;
import server.olimpo.repository.PaymentRepository;
import server.olimpo.util.Pagination;

import java.math.BigDecimal;
import java.time.LocalDate;
@Service
public class MembershipService {

    private final MembershipRepository membershipRepository;
    private final PaymentRepository paymentRepository;
    private final ClientRepository clientRepository;
    private final ClientService clientService;

    public MembershipService(MembershipRepository membershipRepository,
                             PaymentRepository paymentRepository,
                             ClientRepository clientRepository,
                             ClientService clientService) {
        this.membershipRepository = membershipRepository;
        this.paymentRepository = paymentRepository;
        this.clientRepository = clientRepository;
        this.clientService = clientService;
    }

    @Transactional
    public MembershipResponse createMembership(CreateMembershipRequest request) {
        String type = validateType(request.type());
        String method = validateMethod(request.method());
        BigDecimal price = validatePrice(request.price());

        clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + request.clientId()));

        membershipRepository.findByClientIdAndStatus(request.clientId(), MembershipStatus.ACTIVE.name())
                .ifPresent(existing -> {
                    throw new BusinessException("Client already has an ACTIVE membership (id: "
                            + existing.getId() + "). Renew it via PATCH /api/v1/memberships/{id}/renew");
                });

        LocalDate start = request.startDate() != null ? request.startDate() : LocalDate.now();
        LocalDate end = start.plusDays(durationDays(MembershipType.valueOf(type)));

        Membership membership = Membership.builder()
                .clientId(request.clientId())
                .type(type)
                .startDate(start)
                .endDate(end)
                .status(MembershipStatus.ACTIVE.name())
                .price(price)
                .build();
        membershipRepository.save(membership);

        registerPayment(membership, price, method, request.reference());
        return toResponse(membership);
    }

    @Transactional
    public MembershipResponse renewMembership(Long id, RenewMembershipRequest request) {
        String type = validateType(request.type());
        String method = validateMethod(request.method());
        BigDecimal price = validatePrice(request.price());

        Membership membership = membershipRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found with id: " + id));

        if (!MembershipStatus.ACTIVE.name().equals(membership.getStatus())) {
            throw new BusinessException("Only ACTIVE memberships can be renewed (status: "
                    + membership.getStatus() + "). Create a new one via POST /api/v1/memberships");
        }

        LocalDate today = LocalDate.now();
        LocalDate base = membership.getEndDate().isBefore(today) ? today : membership.getEndDate();
        membership.setEndDate(base.plusDays(durationDays(MembershipType.valueOf(type))));
        membership.setType(type);
        membership.setPrice(price);
        membershipRepository.save(membership);

        registerPayment(membership, price, method, request.reference());
        return toResponse(membership);
    }

    public MembershipResponse getActiveMembership(Long clientId, Authentication authentication) {
        Long effectiveClientId;
        if (clientService.isClientRole(authentication)) {
            effectiveClientId = clientService.resolveOwnClientId(authentication);
        } else {
            if (clientId == null) {
                throw new IllegalArgumentException("clientId query parameter is required");
            }
            effectiveClientId = clientId;
        }

        Membership membership = membershipRepository
                .findByClientIdAndStatus(effectiveClientId, MembershipStatus.ACTIVE.name())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No ACTIVE membership found for client id: " + effectiveClientId));
        return toResponse(membership);
    }

    public PageResponse<MembershipResponse> getMembershipsByClient(Long clientId, String search,
                                                                     Pageable pageable,
                                                                     Authentication authentication) {
        clientService.assertCanAccessClient(clientId, authentication);
        return PageResponse.from(membershipRepository.searchByClientId(
                clientId, Pagination.normalizeSearch(search), pageable).map(this::toResponse));
    }

    private void registerPayment(Membership membership, BigDecimal amount, String method, String reference) {
        Payment payment = Payment.builder()
                .membershipId(membership.getId())
                .clientId(membership.getClientId())
                .amount(amount)
                .method(method)
                .reference(reference)
                .build();
        paymentRepository.save(payment);
    }

    private long durationDays(MembershipType type) {
        return switch (type) {
            case DAILY -> 1;
            case QUARTERLY -> 15;
            case MONTHLY -> 30;
        };
    }

    private String validateType(String type) {
        try {
            return MembershipType.valueOf(type.trim().toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid membership type: " + type + ". Allowed: DAILY, QUARTERLY, MONTHLY");
        }
    }

    private String validateMethod(String method) {
        try {
            return PaymentMethod.valueOf(method.trim().toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid payment method: " + method + ". Allowed: CASH, CARD, TRANSFER, NEQUI");
        }
    }

    private BigDecimal validatePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than zero");
        }
        return price.stripTrailingZeros();
    }

    private MembershipResponse toResponse(Membership membership) {
        return new MembershipResponse(membership.getId(), membership.getClientId(), membership.getType(),
                membership.getStartDate(), membership.getEndDate(), membership.getStatus(),
                membership.getPrice(), membership.getCreatedAt());
    }
}
