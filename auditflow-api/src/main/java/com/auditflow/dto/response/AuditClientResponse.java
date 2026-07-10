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
    private String segmento;
    private String site;
    private String emailContato;
    private String endereco;
    private boolean ativo;
    private UserResponse auditorResponsavel;
    private Long totalCiclos;
    private Long ciclosAtivos;
    private LocalDateTime criadoEm;

    // Apenas retornado na criação — link de ativação do usuário CLIENTE (enviado por e-mail;
    // devolvido aqui como contingência para o auditor repassar caso o e-mail não chegue).
    private String linkAtivacao;
}
