package com.auditflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Define a senha a partir de um token de ativação ou de redefinição. */
@Data
public class ResetPasswordRequest {

    @NotBlank(message = "token é obrigatório")
    private String token;

    @NotBlank(message = "novaSenha é obrigatória")
    @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
    @Pattern(regexp = ".*[0-9].*", message = "A senha deve conter pelo menos um número")
    private String novaSenha;
}
