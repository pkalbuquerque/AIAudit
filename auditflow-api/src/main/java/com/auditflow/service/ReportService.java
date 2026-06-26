package com.auditflow.service;

import com.auditflow.domain.entity.AuditClient;
import com.auditflow.domain.entity.AuditCycle;
import com.auditflow.domain.entity.PbcItem;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.CycleStatus;
import com.auditflow.domain.enums.PbcItemStatus;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.AuditClientRepository;
import com.auditflow.domain.repository.AuditCycleRepository;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.dto.response.ReportResponse;
import com.auditflow.security.SecurityUtils;
import com.auditflow.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final AuditCycleRepository auditCycleRepository;
    private final PbcItemRepository pbcItemRepository;
    private final AuditClientRepository auditClientRepository;

    public ReportResponse getReport() {
        UUID tenantId = TenantContext.getTenantId();
        User user = SecurityUtils.getCurrentUser();
        LocalDate hoje = LocalDate.now();
        boolean admin = user.getPerfil() == Perfil.ADMIN;

        List<AuditCycle> cycles = admin
                ? auditCycleRepository.findAllByTenantId(tenantId)
                : auditCycleRepository.findAllByTenantIdAndAuditorIdAndDeletedAtIsNull(tenantId, user.getId());

        Map<UUID, String> clientNames = new LinkedHashMap<>();
        for (AuditClient c : auditClientRepository.findAllByTenantId(tenantId)) {
            clientNames.put(c.getId(), c.getNomeEmpresa());
        }

        long projetosEncerrados = 0, projetosAtivos = 0;
        long pendente = 0, emRevisao = 0, aprovado = 0, rejeitado = 0, atrasados = 0;
        Map<UUID, long[]> acc = new LinkedHashMap<>(); // [total, pend, rev, aprov, rej, atras]
        Map<String, Long> motivos = new LinkedHashMap<>();

        for (AuditCycle cycle : cycles) {
            if (cycle.getStatus() == CycleStatus.ENCERRADO) projetosEncerrados++;
            if (cycle.getStatus() == CycleStatus.EM_ANDAMENTO) projetosAtivos++;

            UUID clientId = cycle.getAuditClientId();
            acc.putIfAbsent(clientId, new long[6]);
            long[] a = acc.get(clientId);

            for (PbcItem item : pbcItemRepository.findAllByCycleIdAndTenantId(cycle.getId(), tenantId)) {
                a[0]++;
                boolean overdue = item.getPrazo() != null && item.getPrazo().isBefore(hoje)
                        && item.getStatus() != PbcItemStatus.APROVADO;
                if (overdue) { atrasados++; a[5]++; }
                switch (item.getStatus()) {
                    case PENDENTE -> { pendente++; a[1]++; }
                    case EM_REVISAO -> { emRevisao++; a[2]++; }
                    case APROVADO -> { aprovado++; a[3]++; }
                    case REJEITADO -> {
                        rejeitado++; a[4]++;
                        String motivo = item.getMotivoRejeicao() != null && !item.getMotivoRejeicao().isBlank()
                                ? item.getMotivoRejeicao() : "Sem motivo informado";
                        motivos.merge(motivo, 1L, Long::sum);
                    }
                }
            }
        }

        long total = pendente + emRevisao + aprovado + rejeitado;
        double taxa = total == 0 ? 0.0 : (double) (emRevisao + aprovado) / total;

        List<ReportResponse.ClientePerf> desempenho = new ArrayList<>();
        acc.forEach((clientId, a) -> {
            if (a[0] == 0) return;
            desempenho.add(ReportResponse.ClientePerf.builder()
                    .clienteId(clientId)
                    .cliente(clientNames.getOrDefault(clientId, "—"))
                    .total(a[0]).pendentes(a[1]).emRevisao(a[2]).aprovados(a[3]).rejeitados(a[4]).atrasados(a[5])
                    .build());
        });
        desempenho.sort(Comparator.comparingLong(ReportResponse.ClientePerf::getTotal).reversed());

        List<ReportResponse.MotivoRejeicao> maisRejeitados = new ArrayList<>();
        motivos.forEach((m, c) -> maisRejeitados.add(
                ReportResponse.MotivoRejeicao.builder().motivo(m).total(c).build()));
        maisRejeitados.sort(Comparator.comparingLong(ReportResponse.MotivoRejeicao::getTotal).reversed());

        Map<String, Long> porStatus = new LinkedHashMap<>();
        porStatus.put("PENDENTE", pendente);
        porStatus.put("EM_REVISAO", emRevisao);
        porStatus.put("APROVADO", aprovado);
        porStatus.put("REJEITADO", rejeitado);

        return ReportResponse.builder()
                .projetosTotal(cycles.size())
                .projetosEncerrados(projetosEncerrados)
                .projetosAtivos(projetosAtivos)
                .itensTotal(total)
                .itensAtrasados(atrasados)
                .taxaEntrega(taxa)
                .itensPorStatus(porStatus)
                .desempenhoPorCliente(desempenho)
                .maisRejeitados(maisRejeitados.size() > 5 ? maisRejeitados.subList(0, 5) : maisRejeitados)
                .build();
    }
}
