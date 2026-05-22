package com.auditflow.service;

import com.auditflow.domain.entity.AuditCycle;
import com.auditflow.domain.enums.CycleStatus;
import com.auditflow.domain.repository.AuditClientRepository;
import com.auditflow.domain.repository.AuditCycleRepository;
import com.auditflow.dto.request.CreateAuditCycleRequest;
import com.auditflow.dto.request.UpdateCycleStatusRequest;
import com.auditflow.dto.response.AuditCycleResponse;
import com.auditflow.security.SecurityUtils;
import com.auditflow.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditCycleService {

    private final AuditCycleRepository auditCycleRepository;
    private final AuditClientRepository auditClientRepository;

    @Transactional
    public AuditCycleResponse create(CreateAuditCycleRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID auditorId = SecurityUtils.getCurrentUser().getId();

        auditClientRepository.findById(request.getAuditClientId())
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

        AuditCycle cycle = AuditCycle.builder()
                .tenantId(tenantId)
                .auditClientId(request.getAuditClientId())
                .auditorId(auditorId)
                .titulo(request.getTitulo())
                .status(CycleStatus.ABERTO)
                .build();

        cycle = auditCycleRepository.save(cycle);
        return toResponse(cycle);
    }

    public List<AuditCycleResponse> findAll(CycleStatus status, UUID auditClientId) {
        UUID tenantId = TenantContext.getTenantId();
        List<AuditCycle> cycles;

        if (status != null && auditClientId != null) {
            cycles = auditCycleRepository.findAllByTenantIdAndAuditClientIdAndStatus(tenantId, auditClientId, status);
        } else if (status != null) {
            cycles = auditCycleRepository.findAllByTenantIdAndStatus(tenantId, status);
        } else if (auditClientId != null) {
            cycles = auditCycleRepository.findAllByTenantIdAndAuditClientId(tenantId, auditClientId);
        } else {
            cycles = auditCycleRepository.findAllByTenantId(tenantId);
        }

        return cycles.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AuditCycleResponse findById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        AuditCycle cycle = auditCycleRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Ciclo não encontrado"));
        return toResponse(cycle);
    }

    @Transactional
    public AuditCycleResponse advanceStatus(UUID id, UpdateCycleStatusRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        AuditCycle cycle = auditCycleRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Ciclo não encontrado"));

        CycleStatus current = cycle.getStatus();
        CycleStatus next = request.getStatus();

        if (next.ordinal() != current.ordinal() + 1) {
            throw new IllegalArgumentException(
                    "Transição de status inválida: " + current + " → " + next +
                    ". A ordem obrigatória é ABERTO → EM_ANDAMENTO → ENCERRADO.");
        }

        cycle.setStatus(next);
        cycle = auditCycleRepository.save(cycle);
        return toResponse(cycle);
    }

    private AuditCycleResponse toResponse(AuditCycle cycle) {
        return AuditCycleResponse.builder()
                .id(cycle.getId())
                .tenantId(cycle.getTenantId())
                .auditClientId(cycle.getAuditClientId())
                .auditorId(cycle.getAuditorId())
                .titulo(cycle.getTitulo())
                .status(cycle.getStatus())
                .criadoEm(cycle.getCriadoEm())
                .build();
    }
}
