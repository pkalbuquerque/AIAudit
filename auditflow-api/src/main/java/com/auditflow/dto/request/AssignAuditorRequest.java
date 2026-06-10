package com.auditflow.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignAuditorRequest {

    @NotNull(message = "auditorId é obrigatório")
    private UUID auditorId;
}
