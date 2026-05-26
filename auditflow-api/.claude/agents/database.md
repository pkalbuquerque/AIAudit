# Agente Database — AuditFlow

## Supabase

**Projeto:** AIAudit  
**Project ref:** `nztepkeqytclgzeacfnx`  
**Região:** sa-east-1 (São Paulo)  
**Status:** ACTIVE_HEALTHY  
**PostgreSQL:** 17.6  

## Conexão JDBC (Spring Boot)

```properties
# Transaction Pooler — IPv4 compatível
spring.datasource.url=jdbc:postgresql://aws-1-sa-east-1.pooler.supabase.com:6543/postgres
spring.datasource.username=postgres.nztepkeqytclgzeacfnx
spring.datasource.password=${SUPABASE_DB_PASSWORD}
spring.datasource.hikari.data-source-properties.sslmode=require
spring.datasource.hikari.data-source-properties.prepareThreshold=0
spring.jpa.hibernate.ddl-auto=validate
```

> **Por que Transaction Pooler?** O host direto `db.nztepkeqytclgzeacfnx.supabase.co` é IPv6-only. Redes domésticas são IPv4. O pooler `aws-1-sa-east-1` é IPv4 compatível.

> **Por que prepareThreshold=0?** Transaction Pooler não suporta prepared statements do PostgreSQL.

## Regras de DDL

- **NUNCA** usar `ddl-auto=create` ou `ddl-auto=update` — destrói/altera o schema sem controle
- **SEMPRE** usar `ddl-auto=validate` — detecta divergências entre entidades e banco
- Para criar ou alterar tabelas: usar o **MCP do Supabase** com `apply_migration`
- Nomear migrations em snake_case descritivo: `add_senha_hash_to_users`, `create_audit_logs_table`

## Como criar uma migration via MCP

```
Ferramenta: mcp__98a5a2c3-a670-4433-9120-a82f336ae3af__apply_migration
project_id: nztepkeqytclgzeacfnx
name: descricao_da_migration
query: <SQL DDL aqui>
```

## Schema atual (schema public)

### `tenants`
```sql
id           uuid        NOT NULL  PK
nome         text        NOT NULL
email_contato text       NOT NULL
criado_em    timestamptz NOT NULL  DEFAULT now()
```

### `users`
```sql
id              uuid        NOT NULL  PK
tenant_id       uuid        NOT NULL  FK → tenants.id
audit_client_id uuid        NULL      FK → audit_clients.id (só CLIENTE tem)
nome            text        NOT NULL
email           text        NOT NULL  UNIQUE
senha_hash      text        NOT NULL
perfil          text        NOT NULL  (ADMIN | AUDITOR | CLIENTE)
criado_em       timestamptz NOT NULL  DEFAULT now()
```

### `audit_clients`
```sql
id           uuid        NOT NULL  PK
tenant_id    uuid        NOT NULL
nome_empresa text        NOT NULL
cnpj         text        NOT NULL
criado_em    timestamptz NOT NULL  DEFAULT now()
```

### `audit_cycles`
```sql
id              uuid        NOT NULL  PK
tenant_id       uuid        NOT NULL
audit_client_id uuid        NOT NULL
auditor_id      uuid        NOT NULL  FK → users.id
titulo          text        NOT NULL
status          text        NOT NULL  (ABERTO | EM_ANDAMENTO | ENCERRADO)
criado_em       timestamptz NOT NULL  DEFAULT now()
```

### `pbc_items`
```sql
id               uuid        NOT NULL  PK
tenant_id        uuid        NOT NULL
cycle_id         uuid        NOT NULL  FK → audit_cycles.id
responsavel_id   uuid        NOT NULL  FK → users.id
titulo           text        NOT NULL
descricao        text        NULL
prazo            date        NULL
status           text        NOT NULL  (PENDENTE | ENVIADO | APROVADO | REJEITADO)
motivo_rejeicao  text        NULL
criado_em        timestamptz NOT NULL  DEFAULT now()
```

### `documents`
```sql
id           uuid        NOT NULL  PK
tenant_id    uuid        NOT NULL
pbc_item_id  uuid        NOT NULL  FK → pbc_items.id
enviado_por  uuid        NOT NULL  FK → users.id
storage_path text        NOT NULL
nome_arquivo text        NOT NULL
criado_em    timestamptz NOT NULL  DEFAULT now()
```

### `comments`
```sql
id          uuid        NOT NULL  PK
tenant_id   uuid        NOT NULL
pbc_item_id uuid        NOT NULL  FK → pbc_items.id
autor_id    uuid        NOT NULL  FK → users.id
texto       text        NOT NULL
criado_em   timestamptz NOT NULL  DEFAULT now()
```

### `audit_logs`
```sql
id          uuid        NOT NULL  PK
tenant_id   uuid        NOT NULL
usuario_id  uuid        NOT NULL
acao        text        NOT NULL
entidade    text        NOT NULL
entidade_id uuid        NULL
ip          text        NULL
criado_em   timestamptz NOT NULL  DEFAULT now()
```

## RLS (Row Level Security)

- RLS está **habilitado** em todas as tabelas
- As policies existentes são todas `service_role_* → qual: true` (permitem tudo para o user postgres)
- **Isso é intencional** — a proteção por tenant é feita na camada Java via `TenantContext`
- O app conecta como `postgres` (superuser do pooler), que bypassa RLS

## Padrões de query nos repositórios

```java
// Sempre filtrar por tenantId — nunca buscar sem ele
List<AuditClient> findAllByTenantId(UUID tenantId);

// Validação de ownership: usar filter() para retornar 404 se tenant errado
entity.findById(id)
      .filter(e -> e.getTenantId().equals(tenantId))
      .orElseThrow(() -> new EntityNotFoundException("..."));

// Ordenação: incluir no nome do método
List<Comment> findAllByPbcItemIdAndTenantIdOrderByCriadoEmAsc(...);
```

## Convenções de nomes

| Java (entidade) | Banco (coluna) |
|-----------------|----------------|
| `tenantId` | `tenant_id` |
| `nomeEmpresa` | `nome_empresa` |
| `senhaHash` | `senha_hash` |
| `criadoEm` | `criado_em` |
| `auditClientId` | `audit_client_id` |
| `responsavelId` | `responsavel_id` |
| `motivoRejeicao` | `motivo_rejeicao` |

> Hibernate converte camelCase → snake_case automaticamente via `SpringPhysicalNamingStrategy`.

## Checklist antes de criar uma migration

- [ ] A coluna nova tem valor DEFAULT ou é nullable? (necessário para tabelas com dados)
- [ ] A migration é reversível?
- [ ] O `ddl-auto=validate` vai passar após a migration?
- [ ] A entidade JPA correspondente foi atualizada?
