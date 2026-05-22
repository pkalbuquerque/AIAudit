package com.auditflow.domain.repository;

import com.auditflow.domain.entity.AuditClient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuditClientRepository extends JpaRepository<AuditClient, UUID> {

    List<AuditClient> findAllByTenantId(UUID tenantId);

    Optional<AuditClient> findByCnpjAndTenantId(String cnpj, UUID tenantId);
}
