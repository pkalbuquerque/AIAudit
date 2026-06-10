package com.auditflow.domain.entity;

import com.auditflow.domain.enums.PbcItemStatus;
import com.auditflow.domain.enums.Prioridade;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pbc_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PbcItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "cycle_id", nullable = false)
    private UUID cycleId;

    @Column(name = "responsavel_id", nullable = false)
    private UUID responsavelId;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private LocalDate prazo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PbcItemStatus status;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Prioridade prioridade = Prioridade.MEDIA;

    @ElementCollection
    @CollectionTable(name = "pbc_item_criterios", joinColumns = @JoinColumn(name = "pbc_item_id"))
    @Column(name = "criterio")
    @Builder.Default
    private List<String> criteriosDeAceite = new ArrayList<>();

    @Column(name = "motivo_rejeicao")
    private String motivoRejeicao;

    @CreationTimestamp
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;
}
