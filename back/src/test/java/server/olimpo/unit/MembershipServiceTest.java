package server.olimpo.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import server.olimpo.dto.request.CreateMembershipRequest;
import server.olimpo.dto.request.RenewMembershipRequest;
import server.olimpo.dto.response.MembershipResponse;
import server.olimpo.entity.Client;
import server.olimpo.entity.Membership;
import server.olimpo.entity.Payment;
import server.olimpo.exception.BusinessException;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.ClientRepository;
import server.olimpo.repository.MembershipRepository;
import server.olimpo.repository.PaymentRepository;
import server.olimpo.service.ClientService;
import server.olimpo.service.MembershipService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MembershipServiceTest {

    @Mock
    private MembershipRepository membershipRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private ClientService clientService;

    private MembershipService service() {
        return new MembershipService(membershipRepository, paymentRepository,
                clientRepository, clientService);
    }

    private CreateMembershipRequest createRequest(Long clientId, String type, String method) {
        return new CreateMembershipRequest(clientId, type, new BigDecimal("120000"), method, "REF-1", null);
    }

    @Test
    @DisplayName("S3: MONTHLY membership runs 30 days and auto-registers a payment")
    void createMonthlySuccess() {
        when(clientRepository.findById(1L)).thenReturn(Optional.of(Client.builder().id(1L).build()));
        when(membershipRepository.findByClientIdAndStatus(1L, "ACTIVE")).thenReturn(Optional.empty());
        when(membershipRepository.save(any(Membership.class))).thenAnswer(inv -> {
            Membership m = inv.getArgument(0);
            m.setId(30L);
            return m;
        });

        MembershipResponse response = service().createMembership(createRequest(1L, "MONTHLY", "CASH"));

        assertEquals(30L, response.id());
        assertEquals("ACTIVE", response.status());
        assertEquals(LocalDate.now(), response.startDate());
        assertEquals(LocalDate.now().plusDays(30), response.endDate());
        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        assertEquals(30L, captor.getValue().getMembershipId());
        assertEquals(1L, captor.getValue().getClientId());
        assertEquals("CASH", captor.getValue().getMethod());
    }

    @Test
    @DisplayName("S3: DAILY membership lasts 1 day and QUARTERLY lasts 15 days")
    void durationsPerType() {
        when(clientRepository.findById(2L)).thenReturn(Optional.of(Client.builder().id(2L).build()));
        when(membershipRepository.findByClientIdAndStatus(2L, "ACTIVE")).thenReturn(Optional.empty());
        when(membershipRepository.save(any(Membership.class))).thenAnswer(inv -> {
            Membership m = inv.getArgument(0);
            m.setId(31L);
            return m;
        });

        MembershipResponse daily = service().createMembership(createRequest(2L, "DAILY", "CASH"));
        assertEquals(LocalDate.now().plusDays(1), daily.endDate());

        MembershipResponse quarterly = service().createMembership(createRequest(2L, "QUARTERLY", "CARD"));
        assertEquals(LocalDate.now().plusDays(15), quarterly.endDate());
    }

    @Test
    @DisplayName("S3: second ACTIVE membership -> 409 BusinessException")
    void activeConflictRejected() {
        Membership existing = Membership.builder().id(20L).clientId(1L).status("ACTIVE").build();
        when(clientRepository.findById(1L)).thenReturn(Optional.of(Client.builder().id(1L).build()));
        when(membershipRepository.findByClientIdAndStatus(1L, "ACTIVE")).thenReturn(Optional.of(existing));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service().createMembership(createRequest(1L, "MONTHLY", "CASH")));

        assertTrue(ex.getMessage().contains("ACTIVE membership"));
        verify(membershipRepository, never()).save(any());
    }

    @Test
    @DisplayName("S3: invalid type -> 400 with allowed list")
    void invalidTypeRejected() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().createMembership(createRequest(1L, "YEARLY", "CASH")));
        assertTrue(ex.getMessage().contains("DAILY, QUARTERLY, MONTHLY"));
    }

    @Test
    @DisplayName("S3: invalid method -> 400 with allowed list")
    void invalidMethodRejected() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().createMembership(createRequest(1L, "MONTHLY", "BITCOIN")));
        assertTrue(ex.getMessage().contains("CASH, CARD, TRANSFER, NEQUI"));
    }

    @Test
    @DisplayName("S3: zero price -> 400")
    void zeroPriceRejected() {
        CreateMembershipRequest request = new CreateMembershipRequest(1L, "MONTHLY",
                BigDecimal.ZERO, "CASH", "REF-1", null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().createMembership(request));
        assertTrue(ex.getMessage().contains("greater than zero"));
    }

    @Test
    @DisplayName("S3: unknown client -> 404")
    void unknownClientRejected() {
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service().createMembership(createRequest(99L, "MONTHLY", "CASH")));
    }

    @Test
    @DisplayName("S3: renew extends from max(endDate, today) and records a payment")
    void renewExtendsFutureEndDate() {
        LocalDate oldEnd = LocalDate.now().plusDays(10);
        Membership membership = Membership.builder().id(30L).clientId(1L)
                .status("ACTIVE").endDate(oldEnd).build();
        when(membershipRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(membership));

        MembershipResponse response = service().renewMembership(30L,
                new RenewMembershipRequest("QUARTERLY", new BigDecimal("80000"), "CARD", "REF-2"));

        assertEquals(oldEnd.plusDays(15), response.endDate());
        assertEquals("QUARTERLY", response.type());
        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        assertEquals("CARD", captor.getValue().getMethod());
    }

    @Test
    @DisplayName("S3: renew from a past endDate counts from today")
    void renewStartsFromTodayWhenExpired() {
        Membership membership = Membership.builder().id(30L).clientId(1L)
                .status("ACTIVE").endDate(LocalDate.now().minusDays(5)).build();
        when(membershipRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(membership));

        MembershipResponse response = service().renewMembership(30L,
                new RenewMembershipRequest("MONTHLY", new BigDecimal("50000"), "CASH", null));

        assertEquals(LocalDate.now().plusDays(30), response.endDate());
    }

    @Test
    @DisplayName("S3: renewing a non-ACTIVE membership -> 409")
    void renewInactiveRejected() {
        Membership membership = Membership.builder().id(30L).clientId(1L)
                .status("EXPIRED").endDate(LocalDate.now()).build();
        when(membershipRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(membership));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service().renewMembership(30L,
                        new RenewMembershipRequest("MONTHLY", new BigDecimal("50000"), "CASH", null)));
        assertTrue(ex.getMessage().contains("Only ACTIVE"));
    }

    @Test
    @DisplayName("S3: renew unknown membership -> 404")
    void renewUnknownMembership() {
        when(membershipRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service().renewMembership(99L,
                        new RenewMembershipRequest("MONTHLY", new BigDecimal("50000"), "CASH", null)));
    }

    @Test
    @DisplayName("S3 /active as staff without clientId -> 400")
    void activeForStaffRequiresClientId() {
        var auth = org.springframework.security.authentication.UsernamePasswordAuthenticationToken
                .authenticated("recepcionista@olimpo.com", null, java.util.List.of());
        when(clientService.isClientRole(auth)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().getActiveMembership(null, auth));
        assertTrue(ex.getMessage().contains("clientId"));
    }

    @Test
    @DisplayName("S3 /active as ADMIN returns the requested client's membership")
    void activeAsStaff() {
        var auth = org.springframework.security.authentication.UsernamePasswordAuthenticationToken
                .authenticated("admin@olimpo.com", null, java.util.List.of());
        when(clientService.isClientRole(auth)).thenReturn(false);
        when(membershipRepository.findByClientIdAndStatus(1L, "ACTIVE"))
                .thenReturn(Optional.of(Membership.builder().id(30L).clientId(1L).status("ACTIVE").build()));

        MembershipResponse response = service().getActiveMembership(1L, auth);

        assertEquals(30L, response.id());
    }

    @Test
    @DisplayName("S3 /active as CLIENT always resolves its own client id")
    void activeAsClientResolvesOwn() {
        var auth = org.springframework.security.authentication.UsernamePasswordAuthenticationToken
                .authenticated("cliente1@olimpo.com", null, java.util.List.of());
        when(clientService.isClientRole(auth)).thenReturn(true);
        when(clientService.resolveOwnClientId(auth)).thenReturn(1L);
        when(membershipRepository.findByClientIdAndStatus(1L, "ACTIVE"))
                .thenReturn(Optional.of(Membership.builder().id(30L).clientId(1L).status("ACTIVE").build()));

        MembershipResponse response = service().getActiveMembership(null, auth);

        assertEquals(30L, response.id());
        verify(membershipRepository).findByClientIdAndStatus(1L, "ACTIVE");
    }

    @Test
    @DisplayName("S3 /active without membership -> 404")
    void activeMissing() {
        var auth = org.springframework.security.authentication.UsernamePasswordAuthenticationToken
                .authenticated("admin@olimpo.com", null, java.util.List.of());
        when(clientService.isClientRole(auth)).thenReturn(false);
        when(membershipRepository.findByClientIdAndStatus(7L, "ACTIVE")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().getActiveMembership(7L, auth));
    }
}