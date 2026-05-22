package com.auditflow.service;

import com.auditflow.domain.entity.PbcItem;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.enums.PbcItemStatus;
import com.auditflow.domain.repository.AuditCycleRepository;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.dto.request.CreatePbcItemRequest;
import com.auditflow.dto.request.UpdatePbcItemStatusRequest;
import com.auditflow.dto.response.PbcItemResponse;
import com.auditflow.security.SecurityUtils;
import com.auditflow.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PbcItemService {

    private final PbcItemRepository pbcItemRepository;
    private final AuditCycleRepository auditCycleRepository;

    @Transactional
    public PbcItemResponse create(UUID cycleId, CreatePbcItemRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        auditCycleRepository.findById(cycleId)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Ciclo não encontrado"));

        PbcItem item = PbcItem.builder()
                .tenantId(tenantId)
                .cycleId(cycleId)
                .responsavelId(request.getResponsavelId())
                .titulo(request.getTitulo())
                .descricao(request.getDescricao())
                .prazo(request.getPrazo())
                .status(PbcItemStatus.PENDENTE)
                .build();

        item = pbcItemRepository.save(item);
        return toResponse(item);
    }

    public List<PbcItemResponse> findAll(UUID cycleId) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        auditCycleRepository.findById(cycleId)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Ciclo não encontrado"));

        List<PbcItem> items;
        if (currentUser.getPerfil() == Perfil.CLIENTE) {
            items = pbcItemRepository.findAllByCycleIdAndTenantIdAndResponsavelId(
                    cycleId, tenantId, currentUser.getId());
        } else {
            items = pbcItemRepository.findAllByCycleIdAndTenantId(cycleId, tenantId);
        }

        return items.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PbcItemResponse findById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        PbcItem item = pbcItemRepository.findById(id)
                .filter(i -> i.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Item PBC não encontrado"));
        return toResponse(item);
    }

    @Transactional
    public PbcItemResponse updateStatus(UUID id, UpdatePbcItemStatusRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();
        Perfil perfil = currentUser.getPerfil();

        PbcItem item = pbcItemRepository.findById(id)
                .filter(i -> i.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Item PBC não encontrado"));

        PbcItemStatus newStatus = request.getStatus();

        switch (newStatus) {
            case ENVIADO -> {
                if (perfil != Perfil.CLIENTE) {
                    throw new AccessDeniedException("Apenas CLIENTE pode marcar um item como ENVIADO");
                }
                if (item.getStatus() != PbcItemStatus.PENDENTE && item.getStatus() != PbcItemStatus.REJEITADO) {
                    throw new IllegalArgumentException(
                            "Transição inválida: " + item.getStatus() + " → ENVIADO");
                }
            }
            case APROVADO, REJEITADO -> {
                if (perfil == Perfil.CLIENTE) {
                    throw new AccessDeniedException("CLIENTE não pode aprovar ou rejeitar itens");
                }
                if (item.getStatus() != PbcItemStatus.ENVIADO) {
                    throw new IllegalArgumentException(
                            "Transição inválida: " + item.getStatus() + " → " + newStatus + ". Item deve estar ENVIADO.");
                }
                if (item.getResponsavelId().equals(currentUser.getId())) {
                    throw new AccessDeniedException(
                            "O responsável pelo envio não pode aprovar o mesmo item");
                }
                if (newStatus == PbcItemStatus.REJEITADO) {
                    if (request.getMotivoRejeicao() == null || request.getMotivoRejeicao().isBlank()) {
                        throw new IllegalArgumentException("motivoRejeicao é obrigatório ao rejeitar um item");
                    }
                    item.setMotivoRejeicao(request.getMotivoRejeicao());
                }
            }
            default -> throw new IllegalArgumentException("Transição de status não permitida: " + newStatus);
        }

        item.setStatus(newStatus);
        item = pbcItemRepository.save(item);
        return toResponse(item);
    }

    public PbcItem getItemValidated(UUID id, UUID tenantId) {
        return pbcItemRepository.findById(id)
                .filter(i -> i.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Item PBC não encontrado"));
    }

    private PbcItemResponse toResponse(PbcItem item) {
        return PbcItemResponse.builder()
                .id(item.getId())
                .tenantId(item.getTenantId())
                .cycleId(item.getCycleId())
                .responsavelId(item.getResponsavelId())
                .titulo(item.getTitulo())
                .descricao(item.getDescricao())
                .prazo(item.getPrazo())
                .status(item.getStatus())
                .motivoRejeicao(item.getMotivoRejeicao())
                .criadoEm(item.getCriadoEm())
                .build();
    }
}
