package com.auditflow.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TenantResponse {

    private UUID id;
    private String nome;
    private String emailContato;
    private String cnpj;
    private String site;
    private String endereco;
    private String cidade;
    private String estado;
    private String cep;
    private LocalDateTime criadoEm;
}
