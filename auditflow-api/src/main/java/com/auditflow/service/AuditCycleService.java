package com.auditflow.service;

import com.auditflow.domain.entity.AuditCycle;
import com.auditflow.domain.enums.CycleStatus;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.enums.PbcItemStatus;
import com.auditflow.domain.repository.AuditClientRepository;
import com.auditflow.domain.repository.AuditCycleRepository;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.dto.request.CreateAuditCycleRequest;
import com.auditflow.dto.request.UpdateCycleStatusRequest;
import com.auditflow.dto.response.AuditCycleResponse;
import com.auditflow.exception.ForbiddenException;
import com.auditflow.exception.InvalidOperationException;
import com.auditflow.exception.InvalidStatusTransitionException;
import com.auditflow.exception.ResourceNotFoundException;
import com.auditflow.security.SecurityUtils;
import com.auditflow.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditCycleService {

    private final AuditCycleRepository auditCycleRepository;
    private final AuditClientRepository auditClientRepository;
    private final PbcItemRepository pbcItemRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public AuditCycleResponse create(CreateAuditCycleRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID auditorId = SecurityUtils.getCurrentUser().getId();

        auditClientRepository.findById(request.getAuditClientId())
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));

        AuditCycle cycle = AuditCycle.builder()
                .tenantId(tenantId)
                .auditClientId(request.getAuditClientId())
                .auditorId(auditorId)
                .titulo(request.getTitulo())
                .tipo(request.getTipo())
                .descricao(request.getDescricao())
                .dataInicio(request.getDataInicio())
                .dataFim(request.getDataFim())
                .status(CycleStatus.ABERTO)
                .build();

        cycle = auditCycleRepository.save(cycle);
        auditLogService.record(tenantId, auditorId, "PROJETO_CRIADO",
                "Projeto \"" + cycle.getTitulo() + "\" criado", "AuditCycle", cycle.getId());
        return toResponse(cycle);
    }

    public List<AuditCycleResponse> findAll(CycleStatus status, UUID auditClientId) {
        UUID tenantId = TenantContext.getTenantId();
        var currentUser = SecurityUtils.getCurrentUser();
        List<AuditCycle> cycles;

        if (currentUser.getPerfil() == Perfil.AUDITOR) {
            UUID auditorId = currentUser.getId();
            if (status != null) {
                cycles = auditCycleRepository.findAllByTenantIdAndAuditorIdAndStatusAndDeletedAtIsNull(tenantId, auditorId, status);
            } else {
                cycles = auditCycleRepository.findAllByTenantIdAndAuditorIdAndDeletedAtIsNull(tenantId, auditorId);
            }
            if (auditClientId != null) {
                cycles = cycles.stream()
                        .filter(c -> c.getAuditClientId().equals(auditClientId))
                        .collect(Collectors.toList());
            }
        } else {
            if (status != null && auditClientId != null) {
                cycles = auditCycleRepository.findAllByTenantIdAndAuditClientIdAndStatusAndDeletedAtIsNull(tenantId, auditClientId, status);
            } else if (status != null) {
                cycles = auditCycleRepository.findAllByTenantIdAndStatusAndDeletedAtIsNull(tenantId, status);
            } else if (auditClientId != null) {
                cycles = auditCycleRepository.findAllByTenantIdAndAuditClientIdAndDeletedAtIsNull(tenantId, auditClientId);
            } else {
                cycles = auditCycleRepository.findAllByTenantIdAndDeletedAtIsNull(tenantId);
            }
        }

        return cycles.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AuditCycleResponse findById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        AuditCycle cycle = auditCycleRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId) && c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Ciclo não encontrado"));
        return toResponse(cycle);
    }

    @Transactional
    public AuditCycleResponse advanceStatus(UUID id, UpdateCycleStatusRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        var currentUser = SecurityUtils.getCurrentUser();
        AuditCycle cycle = auditCycleRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId) && c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Ciclo não encontrado"));

        CycleStatus current = cycle.getStatus();
        CycleStatus next = request.getStatus();

        if (next.ordinal() != current.ordinal() + 1) {
            throw new InvalidStatusTransitionException(
                    "Transição inválida: " + current + " → " + next +
                    ". Ordem obrigatória: ABERTO → EM_ANDAMENTO → ENCERRADO.");
        }

        if (next == CycleStatus.ENCERRADO) {
            if (currentUser.getPerfil() != Perfil.ADMIN) {
                throw new ForbiddenException("Apenas ADMIN pode encerrar um ciclo.");
            }
            boolean forcar = Boolean.TRUE.equals(request.getForcar());
            long total = pbcItemRepository.countByCycleId(id);
            long aprovados = pbcItemRepository.countByCycleIdAndStatus(id, PbcItemStatus.APROVADO);
            boolean incompleto = total > 0 && aprovados < total;

            if (incompleto && !forcar) {
                throw new InvalidOperationException(
                        "Existem itens PBC não aprovados. Use forcar=true para encerrar assim mesmo.");
            }
            if (incompleto) {
                // encerramento à força exige justificativa
                if (request.getJustificativa() == null || request.getJustificativa().isBlank()) {
                    throw new InvalidOperationException(
                            "Informe uma justificativa para encerrar o projeto com itens pendentes.");
                }
                cycle.setJustificativaEncerramento(request.getJustificativa().trim());
            }
        }

        cycle.setStatus(next);
        cycle = auditCycleRepository.save(cycle);
        auditLogService.record(tenantId, currentUser.getId(), "PROJETO_STATUS",
                "Projeto \"" + cycle.getTitulo() + "\" → " + next, "AuditCycle", cycle.getId());
        return toResponse(cycle);
    }

    @Transactional
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        AuditCycle cycle = auditCycleRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId) && c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Ciclo não encontrado"));

        long enviados = pbcItemRepository.countByCycleIdAndStatus(id, PbcItemStatus.EM_REVISAO);
        if (enviados > 0) {
            throw new InvalidOperationException(
                    "Não é possível remover um ciclo com itens PBC em revisão.");
        }

        cycle.setDeletedAt(LocalDateTime.now());
        auditCycleRepository.save(cycle);
    }

    private AuditCycleResponse toResponse(AuditCycle cycle) {
        long total = pbcItemRepository.countByCycleId(cycle.getId());
        long aprovados = pbcItemRepository.countByCycleIdAndStatus(cycle.getId(), PbcItemStatus.APROVADO);
        // progresso em porcentagem (0–100). ABERTO ainda não iniciou → 0.
        double progresso = (total == 0 || cycle.getStatus() == CycleStatus.ABERTO)
                ? 0.0
                : (double) aprovados * 100.0 / total;

        return AuditCycleResponse.builder()
                .id(cycle.getId())
                .tenantId(cycle.getTenantId())
                .auditClientId(cycle.getAuditClientId())
                .auditorId(cycle.getAuditorId())
                .titulo(cycle.getTitulo())
                .tipo(cycle.getTipo())
                .descricao(cycle.getDescricao())
                .dataInicio(cycle.getDataInicio())
                .dataFim(cycle.getDataFim())
                .status(cycle.getStatus())
                .progressoPercent(progresso)
                .justificativaEncerramento(cycle.getJustificativaEncerramento())
                .criadoEm(cycle.getCriadoEm())
                .build();
    }
}
