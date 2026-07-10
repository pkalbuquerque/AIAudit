package com.auditflow.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "email é obrigatório")
    @Email(message = "E-mail inválido")
    private String email;
}
