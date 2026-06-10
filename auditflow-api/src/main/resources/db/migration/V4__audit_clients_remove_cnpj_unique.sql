DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'audit_clients'
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%cnpj%'
    ) THEN
        ALTER TABLE audit_clients DROP CONSTRAINT audit_clients_cnpj_key;
    END IF;
END $$;
