package com.auditflow.service;

import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.CycleStatus;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.enums.PbcItemStatus;
import com.auditflow.domain.repository.AuditCycleRepository;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.dto.response.DashboardResponse;
import com.auditflow.security.SecurityUtils;
import com.auditflow.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PbcItemRepository pbcItemRepository;
    private final AuditCycleRepository auditCycleRepository;

    public DashboardResponse getDashboard() {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();
        LocalDate hoje = LocalDate.now();

        if (currentUser.getPerfil() == Perfil.ADMIN) {
            return buildForAdmin(tenantId, hoje);
        } else {
            return buildForAuditor(tenantId, currentUser.getId(), hoje);
        }
    }

    private DashboardResponse buildForAdmin(UUID tenantId, LocalDate hoje) {
        long filaRevisao = pbcItemRepository.countByTenantIdAndStatus(tenantId, PbcItemStatus.EM_REVISAO);
        long atrasados = pbcItemRepository.countOverdue(tenantId, hoje, PbcItemStatus.APROVADO);
        long aprovadosHoje = pbcItemRepository.countApprovedToday(tenantId, PbcItemStatus.APROVADO, hoje);
        long ciclosAtivos = auditCycleRepository.countByTenantIdAndStatusAndDeletedAtIsNull(tenantId, CycleStatus.EM_ANDAMENTO);

        long pendente = pbcItemRepository.countByTenantIdAndStatus(tenantId, PbcItemStatus.PENDENTE);
        long emRevisao = filaRevisao;
        long aprovado = pbcItemRepository.countByTenantIdAndStatus(tenantId, PbcItemStatus.APROVADO);
        long rejeitado = pbcItemRepository.countByTenantIdAndStatus(tenantId, PbcItemStatus.REJEITADO);
        long total = pendente + emRevisao + aprovado + rejeitado;
        double taxa = total == 0 ? 0.0 : (double) (emRevisao + aprovado) / total;

        return DashboardResponse.builder()
                .filaRevisao(filaRevisao)
                .itensAtrasados(atrasados)
                .aprovadosHoje(aprovadosHoje)
                .totalCiclosAtivos(ciclosAtivos)
                .taxaEntregaGeral(taxa)
                .itensPorStatus(Map.of(
                        "PENDENTE", pendente,
                        "EM_REVISAO", emRevisao,
                        "APROVADO", aprovado,
                        "REJEITADO", rejeitado
                ))
                .build();
    }

    private DashboardResponse buildForAuditor(UUID tenantId, UUID auditorId, LocalDate hoje) {
        long filaRevisao = pbcItemRepository.countByAuditorAndStatus(auditorId, tenantId, PbcItemStatus.EM_REVISAO);
        long atrasados = pbcItemRepository.countOverdueByAuditor(auditorId, tenantId, hoje, PbcItemStatus.APROVADO);
        long aprovadosHoje = pbcItemRepository.countApprovedTodayByAuditor(auditorId, tenantId, PbcItemStatus.APROVADO, hoje);
        long ciclosAtivos = auditCycleRepository.countByTenantIdAndAuditorIdAndStatusAndDeletedAtIsNull(tenantId, auditorId, CycleStatus.EM_ANDAMENTO);

        long pendente = pbcItemRepository.countByAuditorAndStatus(auditorId, tenantId, PbcItemStatus.PENDENTE);
        long emRevisao = filaRevisao;
        long aprovado = pbcItemRepository.countByAuditorAndStatus(auditorId, tenantId, PbcItemStatus.APROVADO);
        long rejeitado = pbcItemRepository.countByAuditorAndStatus(auditorId, tenantId, PbcItemStatus.REJEITADO);
        long total = pendente + emRevisao + aprovado + rejeitado;
        double taxa = total == 0 ? 0.0 : (double) (emRevisao + aprovado) / total;

        return DashboardResponse.builder()
                .filaRevisao(filaRevisao)
                .itensAtrasados(atrasados)
                .aprovadosHoje(aprovadosHoje)
                .totalCiclosAtivos(ciclosAtivos)
                .taxaEntregaGeral(taxa)
                .itensPorStatus(Map.of(
                        "PENDENTE", pendente,
                        "EM_REVISAO", emRevisao,
                        "APROVADO", aprovado,
                        "REJEITADO", rejeitado
                ))
                .build();
    }
}
