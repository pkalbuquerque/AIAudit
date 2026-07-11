package com.auditflow.service;

import com.auditflow.domain.entity.AuditLog;
import com.auditflow.domain.repository.AuditLogRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.response.AuditLogResponse;
import com.auditflow.dto.response.PageResponse;
import com.auditflow.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    /** Registra um evento na trilha de auditoria. Transação própria + tolerante a
        falha, para nunca interromper nem desfazer a operação de negócio. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(UUID tenantId, UUID usuarioId, String acao, String descricao,
                       String entidade, UUID entidadeId) {
        try {
            auditLogRepository.save(AuditLog.builder()
                    .tenantId(tenantId)
                    .usuarioId(usuarioId)
                    .acao(acao)
                    .descricao(descricao)
                    .entidade(entidade)
                    .entidadeId(entidadeId)
                    .build());
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(AuditLogService.class)
                    .warn("[audit] Falha ao registrar log {}: {}", acao, e.getMessage());
        }
    }

    private static final int MAX_PAGE_SIZE = 200;

    /** Trilha de auditoria do tenant, paginada (mais recentes primeiro). */
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getPage(int page, int size) {
        UUID tenantId = TenantContext.getTenantId();
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);

        Map<UUID, String> nomes = new HashMap<>();
        userRepository.findAllByTenantId(tenantId).forEach(u -> nomes.put(u.getId(), u.getNome()));

        var pageResult = auditLogRepository.findByTenantIdOrderByCriadoEmDesc(
                tenantId, PageRequest.of(safePage, safeSize));

        return PageResponse.from(pageResult, log -> AuditLogResponse.builder()
                .id(log.getId())
                .acao(log.getAcao())
                .descricao(log.getDescricao())
                .entidade(log.getEntidade())
                .usuarioNome(nomes.getOrDefault(log.getUsuarioId(), "—"))
                .ip(log.getIp())
                .criadoEm(log.getCriadoEm())
                .build());
    }
}
