package com.auditflow.dto.response;

import com.auditflow.domain.enums.CycleStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AuditCycleResponse {

    private UUID id;
    private UUID tenantId;
    private UUID auditClientId;
    private UUID auditorId;
    private String titulo;
    private String tipo;
    private String descricao;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private CycleStatus status;
    private Double progressoPercent;
    private String justificativaEncerramento;
    private LocalDateTime criadoEm;
}
