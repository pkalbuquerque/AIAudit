package com.auditflow.dto.request;

import com.auditflow.domain.enums.Perfil;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserUpdateRequest {

    @NotBlank(message = "nome é obrigatório")
    private String nome;

    @NotNull(message = "perfil é obrigatório")
    private Perfil perfil;
}
