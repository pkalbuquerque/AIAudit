-- O CHECK constraint de pbc_items.status foi criado manualmente com os valores
-- antigos (incluindo 'ENVIADO', sem 'EM_REVISAO'), o que rejeitava itens enviados
-- para revisão. Recria o constraint com os 4 status atuais do enum PbcItemStatus.
ALTER TABLE pbc_items DROP CONSTRAINT IF EXISTS pbc_items_status_check;
ALTER TABLE pbc_items ADD CONSTRAINT pbc_items_status_check
    CHECK (status IN ('PENDENTE', 'EM_REVISAO', 'APROVADO', 'REJEITADO'));
