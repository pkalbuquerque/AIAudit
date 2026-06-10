package com.auditflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectRequest {

    @NotBlank(message = "motivo é obrigatório")
    private String motivo;
}
