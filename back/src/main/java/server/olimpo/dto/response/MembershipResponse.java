package server.olimpo.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MembershipResponse(
        Long id,
        Long clientId,
        String type,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        BigDecimal price,
        LocalDateTime createdAt) {
}
