package com.auditflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Atualização do próprio perfil (qualquer usuário autenticado). */
@Data
public class UpdateProfileRequest {

    @NotBlank(message = "nome é obrigatório")
    private String nome;
}
