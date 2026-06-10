package com.auditflow.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAuditClientRequest {

    @NotBlank(message = "nomeEmpresa é obrigatório")
    private String nomeEmpresa;

    @NotBlank(message = "cnpj é obrigatório")
    private String cnpj;

    private String segmento;

    private String site;

    private String endereco;

    @NotBlank(message = "nomeUsuario é obrigatório")
    private String nomeUsuario;

    @NotBlank(message = "email é obrigatório")
    @Email(message = "email inválido")
    private String email;
}
