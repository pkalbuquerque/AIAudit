package com.auditflow.dto.response;

import com.auditflow.domain.enums.TokenType;
import lombok.Builder;
import lombok.Data;

/** Contexto de um token para a tela de definir senha (saudação + finalidade). */
@Data
@Builder
public class TokenInfoResponse {

    private boolean valido;
    private String nome;
    private String email;
    private TokenType tipo;
}
