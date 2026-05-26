package com.auditflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "senhaAtual é obrigatória")
    private String senhaAtual;

    @NotBlank(message = "novaSenha é obrigatória")
    @Size(min = 8, message = "Nova senha deve ter no mínimo 8 caracteres")
    @Pattern(regexp = ".*[0-9].*", message = "Nova senha deve conter pelo menos um número")
    private String novaSenha;
}
