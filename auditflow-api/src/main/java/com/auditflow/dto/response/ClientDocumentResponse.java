package com.auditflow.dto.response;

import com.auditflow.domain.enums.PbcItemStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** Documento enviado, com o contexto do item/ciclo — para a aba Documentos do cliente. */
@Data
@Builder
public class ClientDocumentResponse {

    private UUID id;
    private String nomeArquivo;
    private String cicloTitulo;
    private String itemTitulo;
    private PbcItemStatus itemStatus;
    private LocalDateTime enviadoEm;
}
