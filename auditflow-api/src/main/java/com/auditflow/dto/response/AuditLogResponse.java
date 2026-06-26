package com.auditflow.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AuditLogResponse {

    private UUID id;
    private String acao;
    private String descricao;
    private String entidade;
    private String usuarioNome;
    private String ip;
    private LocalDateTime criadoEm;
}
