package com.auditflow.domain.entity;

import com.auditflow.domain.enums.CycleStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_cycles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "audit_client_id", nullable = false)
    private UUID auditClientId;

    @Column(name = "auditor_id", nullable = false)
    private UUID auditorId;

    @Column(nullable = false)
    private String titulo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CycleStatus status;

    @CreationTimestamp
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;
}
