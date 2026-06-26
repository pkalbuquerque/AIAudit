package com.auditflow.dto.request;

import com.auditflow.domain.enums.Perfil;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateUserRequest {

    @NotBlank(message = "nome é obrigatório")
    private String nome;

    @NotBlank(message = "email é obrigatório")
    @Email(message = "email inválido")
    private String email;

    // senha é opcional: o convite gera uma senha provisória no servidor.
    private String senha;

    @NotNull(message = "perfil é obrigatório")
    private Perfil perfil;
}
