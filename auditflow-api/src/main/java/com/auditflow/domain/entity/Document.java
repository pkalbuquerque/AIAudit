package com.auditflow.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "pbc_item_id", nullable = false)
    private UUID pbcItemId;

    @Column(name = "enviado_por", nullable = false)
    private UUID enviadoPor;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @Column(name = "nome_arquivo", nullable = false)
    private String nomeArquivo;

    @CreationTimestamp
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;
}
