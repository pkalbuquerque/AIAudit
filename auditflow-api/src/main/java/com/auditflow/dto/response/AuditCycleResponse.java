package com.auditflow.dto.response;

import com.auditflow.domain.enums.CycleStatus;
import lombok.Builder;
import lombok.Data;

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
    private CycleStatus status;
    private LocalDateTime criadoEm;
}
