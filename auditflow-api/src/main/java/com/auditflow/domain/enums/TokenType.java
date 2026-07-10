package com.auditflow.domain.enums;

/** Finalidade de um {@code PasswordToken}. */
public enum TokenType {
    /** Primeiro acesso: convidado/cliente define a própria senha e ativa a conta. */
    ACTIVATION,
    /** Redefinição de senha solicitada pelo próprio usuário ("esqueci minha senha"). */
    RESET
}
