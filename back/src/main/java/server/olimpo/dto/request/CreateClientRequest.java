package server.olimpo.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateClientRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 255, message = "Email cannot exceed 255 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 72, message = "Password must be between 6 and 72 characters")
        String password,

        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name cannot exceed 100 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name cannot exceed 100 characters")
        String lastName,

        @Size(max = 20, message = "Phone cannot exceed 20 characters")
        String phone,

        @NotBlank(message = "Document number is required")
        @Size(max = 20, message = "Document number cannot exceed 20 characters")
        @Pattern(regexp = "[0-9A-Za-z\\-]+", message = "Document number only allows letters, numbers and hyphens")
        String documentNumber,

        LocalDate birthDate,

        String sex,

        @Size(max = 100, message = "Fitness goal cannot exceed 100 characters")
        String fitnessGoal) {
}
