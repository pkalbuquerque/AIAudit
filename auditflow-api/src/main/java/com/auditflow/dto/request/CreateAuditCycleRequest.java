package com.auditflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateAuditCycleRequest {

    @NotBlank(message = "titulo é obrigatório")
    private String titulo;

    @NotNull(message = "auditClientId é obrigatório")
    private UUID auditClientId;
}
