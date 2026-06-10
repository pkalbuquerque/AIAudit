package com.auditflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateAuditCycleRequest {

    @NotBlank(message = "titulo é obrigatório")
    private String titulo;

    @NotNull(message = "auditClientId é obrigatório")
    private UUID auditClientId;

    private String tipo;

    private String descricao;

    private LocalDate dataInicio;

    private LocalDate dataFim;
}
