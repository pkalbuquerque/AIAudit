-- Tokens de uso único para ativação de convite e redefinição de senha.
-- O token em texto puro vai só no link do e-mail; aqui guardamos apenas o hash SHA-256.
CREATE TABLE IF NOT EXISTS password_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    tipo        VARCHAR(20) NOT NULL,               -- ACTIVATION | RESET
    expira_em   TIMESTAMP   NOT NULL,
    usado_em    TIMESTAMP,
    criado_em   TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_tokens_user ON password_tokens(user_id);
