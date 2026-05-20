package com.auditflow.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Nome do escritório é obrigatório")
    private String nomeEscritorio;

    @NotBlank(message = "E-mail de contato é obrigatório")
    @Email(message = "E-mail de contato inválido")
    private String emailContato;

    @NotBlank(message = "Nome do administrador é obrigatório")
    private String nomeAdmin;

    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    private String senha;
}
