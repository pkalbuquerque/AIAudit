package com.auditflow.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DocumentResponse {

    private UUID id;
    private UUID pbcItemId;
    private UUID enviadoPor;
    private String nomeArquivo;
    private LocalDateTime criadoEm;
}
