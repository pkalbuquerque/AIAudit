package com.auditflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateAuditClientRequest {

    @NotBlank(message = "nomeEmpresa é obrigatório")
    private String nomeEmpresa;

    @NotBlank(message = "cnpj é obrigatório")
    private String cnpj;
}
