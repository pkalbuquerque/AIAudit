package com.auditflow.domain.repository;

import com.auditflow.domain.entity.PbcItem;
import com.auditflow.domain.enums.PbcItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PbcItemRepository extends JpaRepository<PbcItem, UUID> {

    List<PbcItem> findAllByCycleIdAndTenantId(UUID cycleId, UUID tenantId);

    List<PbcItem> findAllByCycleIdAndTenantIdAndResponsavelId(UUID cycleId, UUID tenantId, UUID responsavelId);

    List<PbcItem> findAllByResponsavelIdAndTenantId(UUID responsavelId, UUID tenantId);

    List<PbcItem> findAllByTenantId(UUID tenantId);

    long countByTenantIdAndStatus(UUID tenantId, PbcItemStatus status);

    @Query("SELECT COUNT(p) FROM PbcItem p WHERE p.tenantId = :tenantId AND p.prazo < :hoje AND p.status <> :statusAprovado")
    long countOverdue(@Param("tenantId") UUID tenantId,
                      @Param("hoje") LocalDate hoje,
                      @Param("statusAprovado") PbcItemStatus statusAprovado);

    @Query("SELECT COUNT(p) FROM PbcItem p WHERE p.tenantId = :tenantId AND p.status = :status AND CAST(p.criadoEm AS localdate) = :hoje")
    long countApprovedToday(@Param("tenantId") UUID tenantId,
                            @Param("status") PbcItemStatus status,
                            @Param("hoje") LocalDate hoje);

    @Query("SELECT COUNT(p) FROM PbcItem p JOIN AuditCycle c ON p.cycleId = c.id WHERE c.auditorId = :auditorId AND p.tenantId = :tenantId AND p.status = :status")
    long countByAuditorAndStatus(@Param("auditorId") UUID auditorId,
                                 @Param("tenantId") UUID tenantId,
                                 @Param("status") PbcItemStatus status);

    @Query("SELECT COUNT(p) FROM PbcItem p JOIN AuditCycle c ON p.cycleId = c.id WHERE c.auditorId = :auditorId AND p.tenantId = :tenantId AND p.prazo < :hoje AND p.status <> :statusAprovado")
    long countOverdueByAuditor(@Param("auditorId") UUID auditorId,
                               @Param("tenantId") UUID tenantId,
                               @Param("hoje") LocalDate hoje,
                               @Param("statusAprovado") PbcItemStatus statusAprovado);

    @Query("SELECT COUNT(p) FROM PbcItem p JOIN AuditCycle c ON p.cycleId = c.id WHERE c.auditorId = :auditorId AND p.tenantId = :tenantId AND p.status = :status AND CAST(p.criadoEm AS localdate) = :hoje")
    long countApprovedTodayByAuditor(@Param("auditorId") UUID auditorId,
                                     @Param("tenantId") UUID tenantId,
                                     @Param("status") PbcItemStatus status,
                                     @Param("hoje") LocalDate hoje);

    long countByCycleId(UUID cycleId);

    long countByCycleIdAndStatus(UUID cycleId, PbcItemStatus status);

    /** Itens cuja entrega ainda depende do cliente (PENDENTE/REJEITADO) com prazo
        até a data informada — base para lembretes de atraso/proximidade. */
    @Query("SELECT p FROM PbcItem p WHERE p.prazo IS NOT NULL AND p.prazo <= :limite "
            + "AND p.status IN (com.auditflow.domain.enums.PbcItemStatus.PENDENTE, "
            + "com.auditflow.domain.enums.PbcItemStatus.REJEITADO)")
    List<PbcItem> findPendentesComPrazoAte(@Param("limite") LocalDate limite);
}
