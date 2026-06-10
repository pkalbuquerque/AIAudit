package com.auditflow.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_clients")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditClient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "nome_empresa", nullable = false)
    private String nomeEmpresa;

    @Column(nullable = false)
    private String cnpj;

    private String segmento;

    private String site;

    @Column(name = "email_contato")
    private String emailContato;

    private String endereco;

    @Column(name = "auditor_responsavel_id")
    private UUID auditorResponsavelId;

    @Builder.Default
    @Column(nullable = false)
    private boolean ativo = true;

    @CreationTimestamp
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;
}
