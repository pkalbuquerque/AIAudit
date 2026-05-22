package com.auditflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCommentRequest {

    @NotBlank(message = "texto é obrigatório")
    private String texto;
}
