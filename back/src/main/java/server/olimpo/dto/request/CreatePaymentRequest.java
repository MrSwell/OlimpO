package server.olimpo.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreatePaymentRequest(
        @NotNull(message = "MembershipId is required")
        Long membershipId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than zero")
        BigDecimal amount,

        @NotBlank(message = "Payment method is required")
        @Size(max = 30, message = "Payment method cannot exceed 30 characters")
        String method,

        @Size(max = 100, message = "Reference cannot exceed 100 characters")
        String reference) {
}
