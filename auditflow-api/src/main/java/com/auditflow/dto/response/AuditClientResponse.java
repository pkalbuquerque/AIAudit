package com.auditflow.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditClientResponse {

    private UUID id;
    private UUID tenantId;
    private String nomeEmpresa;
    private String cnpj;
    private LocalDateTime criadoEm;

    // Apenas retornado na criação — senha gerada automaticamente para o usuário CLIENTE
    private String senhaProvisoria;
}
