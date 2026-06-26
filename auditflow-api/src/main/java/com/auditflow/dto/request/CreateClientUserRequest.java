package com.auditflow.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Cria um usuário CLIENTE adicional vinculado a um cliente existente. */
@Data
public class CreateClientUserRequest {

    @NotBlank(message = "nome é obrigatório")
    private String nome;

    @NotBlank(message = "email é obrigatório")
    @Email(message = "email inválido")
    private String email;
}
