CREATE TABLE IF NOT EXISTS pbc_item_criterios (
    pbc_item_id UUID NOT NULL REFERENCES pbc_items(id) ON DELETE CASCADE,
    criterio    VARCHAR(1000) NOT NULL
);
