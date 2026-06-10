package com.auditflow.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TimelineEventResponse {

    private LocalDateTime timestamp;
    private String atorNome;
    private String acao;
    private String descricao;
}
