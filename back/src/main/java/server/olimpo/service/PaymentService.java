package server.olimpo.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.olimpo.dto.request.CreatePaymentRequest;
import server.olimpo.dto.response.PaymentResponse;
import server.olimpo.entity.Membership;
import server.olimpo.entity.Payment;
import server.olimpo.enums.PaymentMethod;
import server.olimpo.exception.ResourceNotFoundException;
import server.olimpo.repository.MembershipRepository;
import server.olimpo.repository.PaymentRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final MembershipRepository membershipRepository;

    public PaymentService(PaymentRepository paymentRepository, MembershipRepository membershipRepository) {
        this.paymentRepository = paymentRepository;
        this.membershipRepository = membershipRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByClient(Long clientId) {
        return paymentRepository.findByClientIdOrderByPaymentDateDesc(clientId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PaymentResponse recordPayment(CreatePaymentRequest request) {
        Membership membership = membershipRepository.findById(request.membershipId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Membership not found with id: " + request.membershipId()));

        validateAmount(request.amount());
        String method = validateMethod(request.method());

        Payment payment = Payment.builder()
                .membershipId(membership.getId())
                .clientId(membership.getClientId())
                .amount(request.amount().stripTrailingZeros())
                .method(method)
                .reference(request.reference())
                .build();
        return toResponse(paymentRepository.save(payment));
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
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

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(payment.getId(), payment.getMembershipId(), payment.getClientId(),
                payment.getAmount(), payment.getMethod(), payment.getReference(), payment.getPaymentDate());
    }
}
