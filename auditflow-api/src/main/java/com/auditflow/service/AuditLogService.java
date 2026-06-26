package com.auditflow.service;

import com.auditflow.domain.entity.AuditLog;
import com.auditflow.domain.repository.AuditLogRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.response.AuditLogResponse;
import com.auditflow.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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

    /** Trilha de auditoria do tenant — mais recentes primeiro. */
    public List<AuditLogResponse> getRecent(int limit) {
        UUID tenantId = TenantContext.getTenantId();

        Map<UUID, String> nomes = new HashMap<>();
        userRepository.findAllByTenantId(tenantId).forEach(u -> nomes.put(u.getId(), u.getNome()));

        return auditLogRepository.findAllByTenantId(tenantId).stream()
                .sorted(Comparator.comparing(
                        com.auditflow.domain.entity.AuditLog::getCriadoEm,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(limit)
                .map(log -> AuditLogResponse.builder()
                        .id(log.getId())
                        .acao(log.getAcao())
                        .descricao(log.getDescricao())
                        .entidade(log.getEntidade())
                        .usuarioNome(nomes.getOrDefault(log.getUsuarioId(), "—"))
                        .ip(log.getIp())
                        .criadoEm(log.getCriadoEm())
                        .build())
                .collect(Collectors.toList());
    }
}
