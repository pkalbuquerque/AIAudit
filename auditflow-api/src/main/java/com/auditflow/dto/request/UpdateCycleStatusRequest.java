package com.auditflow.dto.request;

import com.auditflow.domain.enums.CycleStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateCycleStatusRequest {

    @NotNull(message = "status é obrigatório")
    private CycleStatus status;

    private Boolean forcar;

    /** Obrigatória ao encerrar à força (itens não aprovados). */
    private String justificativa;
}
