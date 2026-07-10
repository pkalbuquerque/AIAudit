package com.auditflow.domain.entity;

import com.auditflow.domain.enums.TokenType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Token de uso único para ativação de conta (convite) ou redefinição de senha.
 * Guarda apenas o hash SHA-256 do token — o valor em texto puro existe só no link do e-mail.
 */
@Entity
@Table(name = "password_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TokenType tipo;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(name = "usado_em")
    private LocalDateTime usadoEm;

    @CreationTimestamp
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    public boolean isUtilizavel() {
        return usadoEm == null && expiraEm.isAfter(LocalDateTime.now());
    }
}
