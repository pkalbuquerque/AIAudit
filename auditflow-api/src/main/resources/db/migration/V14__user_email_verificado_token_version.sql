-- Verificação de e-mail no registro e revogação de tokens (token-version).
ALTER TABLE users ADD COLUMN email_verificado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN token_version   INTEGER NOT NULL DEFAULT 0;

-- Usuários já existentes são considerados verificados — não travar quem já usa o sistema.
UPDATE users SET email_verificado = TRUE;
