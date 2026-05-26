package com.auditflow.service;

import com.auditflow.domain.entity.Document;
import com.auditflow.domain.entity.PbcItem;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.enums.PbcItemStatus;
import com.auditflow.domain.repository.DocumentRepository;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.dto.response.DocumentResponse;
import com.auditflow.security.SecurityUtils;
import com.auditflow.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final PbcItemRepository pbcItemRepository;
    private final StorageService storageService;

    @Transactional
    public DocumentResponse upload(UUID pbcItemId, MultipartFile file) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        PbcItem item = pbcItemRepository.findById(pbcItemId)
                .filter(i -> i.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Item PBC não encontrado"));

        if (currentUser.getPerfil() == Perfil.CLIENTE
                && !item.getResponsavelId().equals(currentUser.getId())) {
            throw new EntityNotFoundException("Item PBC não encontrado");
        }

        String storagePath = storageService.store(file, tenantId, item.getCycleId());

        Document document = Document.builder()
                .tenantId(tenantId)
                .pbcItemId(pbcItemId)
                .enviadoPor(currentUser.getId())
                .storagePath(storagePath)
                .nomeArquivo(file.getOriginalFilename())
                .build();
        document = documentRepository.save(document);

        item.setStatus(PbcItemStatus.ENVIADO);
        pbcItemRepository.save(item);

        return toResponse(document);
    }

    public List<DocumentResponse> findAll(UUID pbcItemId) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        PbcItem item = pbcItemRepository.findById(pbcItemId)
                .filter(i -> i.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Item PBC não encontrado"));

        if (currentUser.getPerfil() == Perfil.CLIENTE
                && !item.getResponsavelId().equals(currentUser.getId())) {
            throw new EntityNotFoundException("Item PBC não encontrado");
        }

        return documentRepository.findAllByPbcItemIdAndTenantId(pbcItemId, tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Resource download(UUID documentId) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        Document document = documentRepository.findById(documentId)
                .filter(d -> d.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Documento não encontrado"));

        if (currentUser.getPerfil() == Perfil.CLIENTE) {
            pbcItemRepository.findById(document.getPbcItemId())
                    .filter(i -> i.getResponsavelId().equals(currentUser.getId()))
                    .orElseThrow(() -> new EntityNotFoundException("Documento não encontrado"));
        }

        return storageService.loadAsResource(document.getStoragePath());
    }

    private DocumentResponse toResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .pbcItemId(document.getPbcItemId())
                .enviadoPor(document.getEnviadoPor())
                .nomeArquivo(document.getNomeArquivo())
                .criadoEm(document.getCriadoEm())
                .build();
    }
}
