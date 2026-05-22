package com.auditflow.service;

import com.auditflow.domain.entity.Comment;
import com.auditflow.domain.repository.CommentRepository;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.dto.request.CreateCommentRequest;
import com.auditflow.dto.response.CommentResponse;
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
public class CommentService {

    private final CommentRepository commentRepository;
    private final PbcItemRepository pbcItemRepository;

    @Transactional
    public CommentResponse create(UUID pbcItemId, CreateCommentRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID autorId = SecurityUtils.getCurrentUser().getId();

        pbcItemRepository.findById(pbcItemId)
                .filter(i -> i.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Item PBC não encontrado"));

        Comment comment = Comment.builder()
                .tenantId(tenantId)
                .pbcItemId(pbcItemId)
                .autorId(autorId)
                .texto(request.getTexto())
                .build();

        comment = commentRepository.save(comment);
        return toResponse(comment);
    }

    public List<CommentResponse> findAll(UUID pbcItemId) {
        UUID tenantId = TenantContext.getTenantId();

        pbcItemRepository.findById(pbcItemId)
                .filter(i -> i.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Item PBC não encontrado"));

        return commentRepository.findAllByPbcItemIdAndTenantIdOrderByCriadoEmAsc(pbcItemId, tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse toResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .pbcItemId(comment.getPbcItemId())
                .autorId(comment.getAutorId())
                .texto(comment.getTexto())
                .criadoEm(comment.getCriadoEm())
                .build();
    }
}
