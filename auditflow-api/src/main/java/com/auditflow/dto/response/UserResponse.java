package com.auditflow.dto.response;

import com.auditflow.domain.enums.Perfil;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private UUID id;
    private UUID tenantId;
    private String nome;
    private String email;
    private Perfil perfil;
    private boolean ativo;
    private LocalDateTime criadoEm;

    /** Preenchido apenas na resposta de convite — link de ativação (definição da própria
        senha) enviado por e-mail. Devolvido como contingência caso o e-mail não chegue. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String linkAtivacao;
}
