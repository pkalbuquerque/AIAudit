package com.auditflow.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
    @Size(min = 8, message = "Senha deve ter no mínimo 8 caracteres")
    @Pattern(regexp = ".*[0-9].*", message = "Senha deve conter pelo menos um número")
    private String senha;
}
