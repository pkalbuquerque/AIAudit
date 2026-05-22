package com.auditflow.domain.repository;

import com.auditflow.domain.entity.PbcItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PbcItemRepository extends JpaRepository<PbcItem, UUID> {

    List<PbcItem> findAllByCycleIdAndTenantId(UUID cycleId, UUID tenantId);

    List<PbcItem> findAllByCycleIdAndTenantIdAndResponsavelId(UUID cycleId, UUID tenantId, UUID responsavelId);

    List<PbcItem> findAllByResponsavelIdAndTenantId(UUID responsavelId, UUID tenantId);
}
