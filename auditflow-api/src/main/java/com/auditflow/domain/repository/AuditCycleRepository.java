package com.auditflow.domain.repository;

import com.auditflow.domain.entity.AuditCycle;
import com.auditflow.domain.enums.CycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditCycleRepository extends JpaRepository<AuditCycle, UUID> {

    List<AuditCycle> findAllByTenantId(UUID tenantId);

    List<AuditCycle> findAllByTenantIdAndAuditClientId(UUID tenantId, UUID auditClientId);

    List<AuditCycle> findAllByTenantIdAndStatus(UUID tenantId, CycleStatus status);

    List<AuditCycle> findAllByTenantIdAndAuditClientIdAndStatus(UUID tenantId, UUID auditClientId, CycleStatus status);
}
