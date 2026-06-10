package com.auditflow.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DashboardResponse {

    private long filaRevisao;
    private long itensAtrasados;
    private long aprovadosHoje;
    private long totalCiclosAtivos;
    private double taxaEntregaGeral;
    private Map<String, Long> itensPorStatus;
}
