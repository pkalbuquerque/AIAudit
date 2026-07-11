package com.auditflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Confirmação de e-mail a partir do token enviado no registro. */
@Data
public class VerifyEmailRequest {

    @NotBlank(message = "token é obrigatório")
    private String token;
}
