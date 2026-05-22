package com.auditflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreatePbcItemRequest {

    @NotBlank(message = "titulo é obrigatório")
    private String titulo;

    private String descricao;

    @NotNull(message = "responsavelId é obrigatório")
    private UUID responsavelId;

    private LocalDate prazo;
}
