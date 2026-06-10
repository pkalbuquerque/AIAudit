package com.auditflow.domain.repository;

import com.auditflow.domain.entity.AuditCycle;
import com.auditflow.domain.enums.CycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditCycleRepository extends JpaRepository<AuditCycle, UUID> {

    List<AuditCycle> findAllByTenantIdAndDeletedAtIsNull(UUID tenantId);

    List<AuditCycle> findAllByTenantIdAndAuditClientIdAndDeletedAtIsNull(UUID tenantId, UUID auditClientId);

    List<AuditCycle> findAllByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, CycleStatus status);

    List<AuditCycle> findAllByTenantIdAndAuditClientIdAndStatusAndDeletedAtIsNull(UUID tenantId, UUID auditClientId, CycleStatus status);

    List<AuditCycle> findAllByTenantIdAndAuditorIdAndDeletedAtIsNull(UUID tenantId, UUID auditorId);

    List<AuditCycle> findAllByTenantIdAndAuditorIdAndStatusAndDeletedAtIsNull(UUID tenantId, UUID auditorId, CycleStatus status);

    long countByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, CycleStatus status);

    long countByTenantIdAndAuditorIdAndStatusAndDeletedAtIsNull(UUID tenantId, UUID auditorId, CycleStatus status);

    default List<AuditCycle> findAllByTenantId(UUID tenantId) {
        return findAllByTenantIdAndDeletedAtIsNull(tenantId);
    }

    default List<AuditCycle> findAllByTenantIdAndAuditClientId(UUID tenantId, UUID auditClientId) {
        return findAllByTenantIdAndAuditClientIdAndDeletedAtIsNull(tenantId, auditClientId);
    }

    default List<AuditCycle> findAllByTenantIdAndStatus(UUID tenantId, CycleStatus status) {
        return findAllByTenantIdAndStatusAndDeletedAtIsNull(tenantId, status);
    }

    default List<AuditCycle> findAllByTenantIdAndAuditClientIdAndStatus(UUID tenantId, UUID auditClientId, CycleStatus status) {
        return findAllByTenantIdAndAuditClientIdAndStatusAndDeletedAtIsNull(tenantId, auditClientId, status);
    }
}
