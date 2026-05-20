package com.auditflow.domain.repository;

import com.auditflow.domain.entity.AuditCycle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditCycleRepository extends JpaRepository<AuditCycle, UUID> {

    List<AuditCycle> findAllByTenantId(UUID tenantId);

    List<AuditCycle> findAllByTenantIdAndAuditClientId(UUID tenantId, UUID auditClientId);
}
