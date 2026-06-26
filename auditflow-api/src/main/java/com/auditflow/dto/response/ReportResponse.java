package com.auditflow.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Métricas agregadas reais para a tela de Relatórios (escopo: tenant p/ ADMIN, próprios p/ AUDITOR). */
@Data
@Builder
public class ReportResponse {

    private long projetosTotal;
    private long projetosEncerrados;
    private long projetosAtivos;
    private long itensTotal;
    private long itensAtrasados;
    private double taxaEntrega;
    private Map<String, Long> itensPorStatus;
    private List<ClientePerf> desempenhoPorCliente;
    private List<MotivoRejeicao> maisRejeitados;

    @Data
    @Builder
    public static class ClientePerf {
        private UUID clienteId;
        private String cliente;
        private long total;
        private long pendentes;
        private long emRevisao;
        private long aprovados;
        private long rejeitados;
        private long atrasados;
    }

    @Data
    @Builder
    public static class MotivoRejeicao {
        private String motivo;
        private long total;
    }
}
