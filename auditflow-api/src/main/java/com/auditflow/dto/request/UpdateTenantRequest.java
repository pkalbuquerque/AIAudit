package com.auditflow.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateTenantRequest {

    @NotBlank(message = "nome é obrigatório")
    private String nome;

    @Email(message = "email inválido")
    private String emailContato;

    private String cnpj;
    private String site;
    private String endereco;
    private String cidade;
    private String estado;
    private String cep;
}
