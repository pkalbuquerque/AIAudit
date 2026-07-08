package com.auditflow.service;

import com.auditflow.domain.entity.AuditCycle;
import com.auditflow.domain.entity.AuditLog;
import com.auditflow.domain.entity.Document;
import com.auditflow.domain.entity.PbcItem;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.CycleStatus;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.enums.PbcItemStatus;
import com.auditflow.domain.repository.AuditCycleRepository;
import com.auditflow.domain.repository.AuditLogRepository;
import com.auditflow.domain.repository.DocumentRepository;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.request.ApproveRequest;
import com.auditflow.dto.request.CreatePbcItemRequest;
import com.auditflow.dto.request.RejectRequest;
import com.auditflow.dto.response.DocumentResponse;
import com.auditflow.dto.response.PbcItemResponse;
import com.auditflow.dto.response.TimelineEventResponse;
import com.auditflow.exception.ForbiddenException;
import com.auditflow.exception.InvalidOperationException;
import com.auditflow.exception.InvalidStatusTransitionException;
import com.auditflow.exception.ResourceNotFoundException;
import com.auditflow.security.SecurityUtils;
import com.auditflow.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PbcItemService {

    private final PbcItemRepository pbcItemRepository;
    private final AuditCycleRepository auditCycleRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final AuditLogRepository auditLogRepository;
    private final StorageService storageService;
    private final NotificationService notificationService;

    @Transactional
    public PbcItemResponse create(UUID cycleId, CreatePbcItemRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        var cycle = auditCycleRepository.findById(cycleId)
                .filter(c -> c.getTenantId().equals(tenantId) && c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Ciclo não encontrado"));

        if (cycle.getStatus() == CycleStatus.ENCERRADO) {
            throw new InvalidOperationException("Não é possível adicionar itens a um projeto encerrado.");
        }

        User dono = userRepository.findById(request.getResponsavelId())
                .filter(u -> u.getTenantId().equals(tenantId) && u.getPerfil() == Perfil.CLIENTE)
                .orElseThrow(() -> new InvalidOperationException("Responsável inválido ou não é um CLIENTE deste tenant"));

        PbcItem item = PbcItem.builder()
                .tenantId(tenantId)
                .cycleId(cycleId)
                .responsavelId(request.getResponsavelId())
                .titulo(request.getTitulo())
                .descricao(request.getDescricao())
                .prazo(request.getPrazo())
                .prioridade(request.getPrioridade() != null ? request.getPrioridade() : com.auditflow.domain.enums.Prioridade.MEDIA)
                .criteriosDeAceite(request.getCriteriosDeAceite() != null ? request.getCriteriosDeAceite() : List.of())
                .status(PbcItemStatus.PENDENTE)
                .build();

        item = pbcItemRepository.save(item);
        log(item, SecurityUtils.getCurrentUser(), "CRIADO", "Item PBC criado", tenantId);
        notificationService.itemCriado(dono.getEmail(), dono.getNome(), item.getTitulo(), cycle.getTitulo());
        return toResponse(item);
    }

    public List<PbcItemResponse> findAll(UUID cycleId) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        auditCycleRepository.findById(cycleId)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Ciclo não encontrado"));

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
        User currentUser = SecurityUtils.getCurrentUser();

        PbcItem item = pbcItemRepository.findById(id)
                .filter(i -> i.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Item PBC não encontrado"));

        if (currentUser.getPerfil() == Perfil.CLIENTE
                && !item.getResponsavelId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Item PBC não encontrado");
        }

        return toResponse(item);
    }

    @Transactional
    public PbcItemResponse submit(UUID id, MultipartFile file) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        PbcItem item = getItemForTenant(id, tenantId);

        if (currentUser.getPerfil() == Perfil.CLIENTE
                && !item.getResponsavelId().equals(currentUser.getId())) {
            throw new ForbiddenException("CLIENTE não pode submeter itens de outros clientes.");
        }

        if (item.getStatus() != PbcItemStatus.PENDENTE && item.getStatus() != PbcItemStatus.REJEITADO) {
            throw new InvalidStatusTransitionException(
                    "Transição inválida: " + item.getStatus() + " → EM_REVISAO. Item deve estar PENDENTE ou REJEITADO.");
        }

        AuditCycle cycle = requireCicloEmAndamento(item.getCycleId(), tenantId);
        String storagePath = storageService.store(file, tenantId, cycle.getId());

        Document document = Document.builder()
                .tenantId(tenantId)
                .pbcItemId(id)
                .enviadoPor(currentUser.getId())
                .storagePath(storagePath)
                .nomeArquivo(file.getOriginalFilename())
                .build();
        documentRepository.save(document);

        item.setStatus(PbcItemStatus.EM_REVISAO);
        item = pbcItemRepository.save(item);

        log(item, currentUser, "SUBMETIDO", "Documento enviado para revisão", tenantId);
        return toResponse(item);
    }

    @Transactional
    public PbcItemResponse approve(UUID id, ApproveRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        PbcItem item = getItemForTenant(id, tenantId);
        requireCicloEmAndamento(item.getCycleId(), tenantId);

        if (item.getStatus() != PbcItemStatus.EM_REVISAO) {
            throw new InvalidStatusTransitionException(
                    "Transição inválida: " + item.getStatus() + " → APROVADO. Item deve estar EM_REVISAO.");
        }

        Document doc = documentRepository.findAllByPbcItemIdAndTenantId(id, tenantId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Nenhum documento encontrado para este item."));

        if (doc.getEnviadoPor().equals(currentUser.getId())) {
            throw new ForbiddenException("O usuário que fez o upload não pode aprovar o mesmo item (separação de deveres).");
        }

        item.setStatus(PbcItemStatus.APROVADO);
        item = pbcItemRepository.save(item);

        String descricao = request.getComentario() != null && !request.getComentario().isBlank()
                ? "Item aprovado. Comentário: " + request.getComentario()
                : "Item aprovado.";
        log(item, currentUser, "APROVADO", descricao, tenantId);
        String titulo = item.getTitulo();
        notifyResponsavel(item.getResponsavelId(), (email, nome) ->
                notificationService.itemAprovado(email, nome, titulo));
        return toResponse(item);
    }

    @Transactional
    public PbcItemResponse reject(UUID id, RejectRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        PbcItem item = getItemForTenant(id, tenantId);
        requireCicloEmAndamento(item.getCycleId(), tenantId);

        if (item.getStatus() != PbcItemStatus.EM_REVISAO) {
            throw new InvalidStatusTransitionException(
                    "Transição inválida: " + item.getStatus() + " → REJEITADO. Item deve estar EM_REVISAO.");
        }

        Document doc = documentRepository.findAllByPbcItemIdAndTenantId(id, tenantId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Nenhum documento encontrado para este item."));

        if (doc.getEnviadoPor().equals(currentUser.getId())) {
            throw new ForbiddenException("O usuário que fez o upload não pode rejeitar o mesmo item (separação de deveres).");
        }

        item.setStatus(PbcItemStatus.REJEITADO);
        item.setMotivoRejeicao(request.getMotivo());
        item = pbcItemRepository.save(item);

        log(item, currentUser, "REJEITADO", "Motivo: " + request.getMotivo(), tenantId);
        String titulo = item.getTitulo();
        String motivo = request.getMotivo();
        notifyResponsavel(item.getResponsavelId(), (email, nome) ->
                notificationService.itemRejeitado(email, nome, titulo, motivo));
        return toResponse(item);
    }

    /** Resolve o usuário responsável (CLIENTE) e dispara a notificação informada. */
    private void notifyResponsavel(UUID responsavelId, java.util.function.BiConsumer<String, String> notifier) {
        userRepository.findById(responsavelId)
                .ifPresent(u -> notifier.accept(u.getEmail(), u.getNome()));
    }

    @Transactional
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        PbcItem item = getItemForTenant(id, tenantId);

        if (item.getStatus() != PbcItemStatus.PENDENTE) {
            throw new InvalidOperationException("Apenas itens com status PENDENTE podem ser removidos.");
        }

        pbcItemRepository.delete(item);
    }

    public PbcItem getItemValidated(UUID id, UUID tenantId) {
        return getItemForTenant(id, tenantId);
    }

    private PbcItem getItemForTenant(UUID id, UUID tenantId) {
        return pbcItemRepository.findById(id)
                .filter(i -> i.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Item PBC não encontrado"));
    }

    /** Garante que o projeto do item está EM ANDAMENTO (evita ações antes de iniciar
        ou depois de encerrar). Retorna o ciclo carregado. */
    private AuditCycle requireCicloEmAndamento(UUID cycleId, UUID tenantId) {
        AuditCycle cycle = auditCycleRepository.findById(cycleId)
                .filter(c -> c.getTenantId().equals(tenantId) && c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Ciclo não encontrado"));
        if (cycle.getStatus() != CycleStatus.EM_ANDAMENTO) {
            throw new InvalidOperationException(
                    "O projeto precisa estar EM ANDAMENTO para esta ação (status atual: "
                            + cycle.getStatus() + ").");
        }
        return cycle;
    }

    private void log(PbcItem item, User ator, String acao, String descricao, UUID tenantId) {
        AuditLog entry = AuditLog.builder()
                .tenantId(tenantId)
                .usuarioId(ator.getId())
                .acao(acao)
                .descricao(descricao)
                .entidade("PbcItem")
                .entidadeId(item.getId())
                .build();
        auditLogRepository.save(entry);
    }

    private PbcItemResponse toResponse(PbcItem item) {
        UUID tenantId = item.getTenantId();
        LocalDate hoje = LocalDate.now();

        boolean isOverdue = item.getPrazo() != null
                && item.getPrazo().isBefore(hoje)
                && item.getStatus() != PbcItemStatus.APROVADO;

        Long daysLeft = item.getPrazo() != null
                ? ChronoUnit.DAYS.between(hoje, item.getPrazo())
                : null;

        List<Document> docs = documentRepository.findAllByPbcItemIdAndTenantId(item.getId(), tenantId);
        DocumentResponse docResp = docs.isEmpty() ? null : toDocumentResponse(docs.get(docs.size() - 1));

        List<TimelineEventResponse> timeline = auditLogRepository
                .findAllByEntidadeIdAndTenantIdOrderByCriadoEmAsc(item.getId(), tenantId)
                .stream()
                .map(log -> {
                    String atorNome = userRepository.findById(log.getUsuarioId())
                            .map(u -> u.getNome())
                            .orElse("Desconhecido");
                    return TimelineEventResponse.builder()
                            .timestamp(log.getCriadoEm())
                            .atorNome(atorNome)
                            .acao(log.getAcao())
                            .descricao(log.getDescricao())
                            .build();
                })
                .collect(Collectors.toList());

        return PbcItemResponse.builder()
                .id(item.getId())
                .tenantId(item.getTenantId())
                .cycleId(item.getCycleId())
                .responsavelId(item.getResponsavelId())
                .titulo(item.getTitulo())
                .descricao(item.getDescricao())
                .prazo(item.getPrazo())
                .status(item.getStatus())
                .prioridade(item.getPrioridade())
                .criteriosDeAceite(item.getCriteriosDeAceite())
                .motivoRejeicao(item.getMotivoRejeicao())
                .isOverdue(isOverdue)
                .daysLeft(daysLeft)
                .documentoAnexado(docResp)
                .timeline(timeline)
                .criadoEm(item.getCriadoEm())
                .build();
    }

    private DocumentResponse toDocumentResponse(Document doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .pbcItemId(doc.getPbcItemId())
                .enviadoPor(doc.getEnviadoPor())
                .nomeArquivo(doc.getNomeArquivo())
                .criadoEm(doc.getCriadoEm())
                .build();
    }
}
