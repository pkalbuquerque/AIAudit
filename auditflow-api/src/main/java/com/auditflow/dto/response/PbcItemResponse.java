package com.auditflow.dto.response;

import com.auditflow.domain.enums.PbcItemStatus;
import com.auditflow.domain.enums.Prioridade;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PbcItemResponse {

    private UUID id;
    private UUID tenantId;
    private UUID cycleId;
    private UUID responsavelId;
    private String titulo;
    private String descricao;
    private LocalDate prazo;
    private PbcItemStatus status;
    private Prioridade prioridade;
    private List<String> criteriosDeAceite;
    private String motivoRejeicao;
    private boolean isOverdue;
    private Long daysLeft;
    private DocumentResponse documentoAnexado;
    private List<TimelineEventResponse> timeline;
    private LocalDateTime criadoEm;
}
