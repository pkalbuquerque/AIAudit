package com.auditflow.dto.response;

import com.auditflow.domain.enums.Perfil;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/** Carga de trabalho de um auditor da firma — alimenta o Dashboard do Manager
    e a tela de Atribuições. */
@Data
@Builder
public class AuditorLoadResponse {

    private UUID auditorId;
    private String nome;
    private String email;
    private Perfil perfil;
    private boolean ativo;
    private long clientes;
    private long ciclosAtivos;
    private long pendentesRevisao;
    private long atrasados;
}
