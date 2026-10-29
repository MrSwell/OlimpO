package server.olimpo.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long membershipId,
        Long clientId,
        BigDecimal amount,
        String method,
        String reference,
        LocalDateTime paymentDate) {
}
