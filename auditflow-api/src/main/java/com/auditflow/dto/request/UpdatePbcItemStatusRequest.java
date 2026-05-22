package com.auditflow.dto.request;

import com.auditflow.domain.enums.PbcItemStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdatePbcItemStatusRequest {

    @NotNull(message = "status é obrigatório")
    private PbcItemStatus status;

    private String motivoRejeicao;
}
