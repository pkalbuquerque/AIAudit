package com.auditflow.domain.repository;

import com.auditflow.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findAllByTenantId(UUID tenantId);

    Page<AuditLog> findByTenantIdOrderByCriadoEmDesc(UUID tenantId, Pageable pageable);

    List<AuditLog> findAllByEntidadeIdAndTenantIdOrderByCriadoEmAsc(UUID entidadeId, UUID tenantId);
}
