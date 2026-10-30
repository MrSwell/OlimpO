package server.olimpo.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import server.olimpo.dto.request.CreatePaymentRequest;
import server.olimpo.dto.response.PaymentResponse;
import server.olimpo.entity.Membership;
import server.olimpo.entity.Payment;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.MembershipRepository;
import server.olimpo.repository.PaymentRepository;
import server.olimpo.service.PaymentService;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private MembershipRepository membershipRepository;

    private PaymentService service() {
        return new PaymentService(paymentRepository, membershipRepository);
    }

    private Membership membership() {
        return Membership.builder().id(30L).clientId(1L).status("ACTIVE").build();
    }

    @Test
    @DisplayName("S3: records a payment linked to membership and client")
    void recordPaymentSuccess() {
        when(membershipRepository.findById(30L)).thenReturn(Optional.of(membership()));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(500L);
            return p;
        });

        PaymentResponse response = service().recordPayment(
                new CreatePaymentRequest(30L, new BigDecimal("50000"), "nequi", "REF-1"));

        assertEquals(500L, response.id());
        assertEquals(30L, response.membershipId());
        assertEquals(1L, response.clientId());
        assertEquals(0, new BigDecimal("50000").compareTo(response.amount()));
        assertEquals("NEQUI", response.method());
    }

    @Test
    @DisplayName("S3: unknown membership -> 404 before validating the rest")
    void unknownMembership() {
        when(membershipRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().recordPayment(
                new CreatePaymentRequest(99L, new BigDecimal("50000"), "CASH", null)));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("S3: amount zero or negative -> 400")
    void zeroAmountRejected() {
        when(membershipRepository.findById(30L)).thenReturn(Optional.of(membership()));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().recordPayment(
                        new CreatePaymentRequest(30L, BigDecimal.ZERO, "CASH", null)));
        assertTrue(ex.getMessage().contains("greater than zero"));
    }

    @Test
    @DisplayName("S3: unknown payment method -> 400 with allowed list")
    void invalidMethodRejected() {
        when(membershipRepository.findById(30L)).thenReturn(Optional.of(membership()));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().recordPayment(
                        new CreatePaymentRequest(30L, new BigDecimal("1000"), "BITCOIN", null)));
        assertTrue(ex.getMessage().contains("CASH, CARD, TRANSFER, NEQUI"));
    }
}