# AuditFlow API — Contexto para Claude

## O que é este projeto

SaaS multi-tenant de gestão de auditorias. Escritórios de auditoria (Tenants) gerenciam clientes, ciclos de auditoria e itens PBC. Está em construção como MVP.

## Stack

- Java 21, Spring Boot 3.3.6, Maven
- Spring Web, Spring Data JPA, Spring Security (stateless JWT)
- PostgreSQL via Supabase (free tier, região sa-east-1)
- Lombok, Validation, Auth0 java-jwt 4.4.0

## Banco de dados (Supabase)

**Projeto:** AIAudit — `nztepkeqytclgzeacfnx`

**Conexão JDBC (Transaction Pooler IPv4):**
```
url: jdbc:postgresql://aws-1-sa-east-1.pooler.supabase.com:6543/postgres
username: postgres.nztepkeqytclgzeacfnx
```

**Regras importantes do banco:**
- Supabase usado APENAS como PostgreSQL gerenciado — sem Auth do Supabase, sem Edge Functions, sem Storage
- RLS está habilitado nas tabelas mas com policies permissivas (`service_role_* → qual: true`) — a proteção de dados é feita no Java, não no banco
- Nenhum trigger ou função SQL customizada — toda lógica fica no Spring Boot
- Para DDL (CREATE, ALTER, DROP): usar o MCP do Supabase (`apply_migration`), não `ddl-auto=create/update`
- `ddl-auto=validate` em produção/dev para detectar divergências cedo

**Tabelas existentes (schema public):**
```
tenants          — id, nome, email_contato, criado_em
users            — id, tenant_id, audit_client_id, nome, email, senha_hash, perfil, criado_em
audit_clients    — id, tenant_id, nome_empresa, cnpj, criado_em
audit_cycles     — id, tenant_id, audit_client_id, auditor_id, titulo, status, criado_em
pbc_items        — id, tenant_id, cycle_id, responsavel_id, titulo, descricao, prazo, status, motivo_rejeicao, criado_em
documents        — id, tenant_id, pbc_item_id, enviado_por, storage_path, nome_arquivo, criado_em
comments         — id, tenant_id, pbc_item_id, autor_id, texto, criado_em
audit_logs       — id, tenant_id, usuario_id, acao, entidade, entidade_id, ip, criado_em
```

## Variáveis de ambiente necessárias

```
SUPABASE_DB_PASSWORD=<senha do banco Supabase>
JWT_SECRET=<string longa qualquer para assinar tokens>
```

Configuradas em: IntelliJ → Run → Edit Configurations → Environment variables

## Arquitetura multi-tenant

- Isolamento por `tenant_id` em todas as tabelas (discriminator column)
- **Nunca** usar RLS do Postgres para isolamento — é feito no Java
- `TenantContext` é um `ThreadLocal<UUID>` setado pelo `JwtAuthFilter` a cada request
- Todo service DEVE filtrar por `TenantContext.getTenantId()` — nunca retornar dados cross-tenant

## Perfis de usuário

```java
enum Perfil { ADMIN, AUDITOR, CLIENTE }
```

- **ADMIN**: dono do escritório, gerencia tudo dentro do tenant
- **AUDITOR**: executa auditorias, gerencia ciclos e PBC items
- **CLIENTE**: empresa auditada, só vê e envia documentos dos seus PBC items

## Fluxo de autenticação

1. `POST /api/auth/register` → cria Tenant + User(ADMIN) em `@Transactional`, retorna JWT
2. `POST /api/auth/login` → valida BCrypt, retorna JWT
3. JWT claims: `sub` (email), `tenantId`, `perfil`, `userId`
4. `JwtAuthFilter`: extrai token → valida → seta `TenantContext` → popula `SecurityContext`

## Estrutura de pacotes (`com.auditflow`)

```
config/           → SecurityConfig (CORS, stateless, BCrypt, filter chain)
controller/       → AuthController [IMPLEMENTADO]
                    AuditClientController, AuditCycleController, PbcItemController [TODO]
domain/
  entity/         → Tenant, User, AuditClient, AuditCycle, PbcItem, Document, Comment, AuditLog
  enums/          → Perfil, CycleStatus, PbcItemStatus
  repository/     → 8 JpaRepositories com queries por tenantId
dto/
  request/        → RegisterRequest, LoginRequest [IMPLEMENTADO]
  response/       → AuthResponse, UserResponse [IMPLEMENTADO]
exception/        → GlobalExceptionHandler, ErrorResponse
security/         → JwtService, JwtAuthFilter, TenantContext
service/          → AuthService [IMPLEMENTADO]
                    AuditClientService, AuditCycleService, PbcItemService [TODO]
```

## O que está implementado

- [x] Auth completo: register (cria Tenant + ADMIN) e login com JWT
- [x] 8 entidades JPA mapeadas para o banco
- [x] 8 repositórios com queries por `tenantId`
- [x] Multi-tenancy via `TenantContext`
- [x] `GlobalExceptionHandler` com respostas padronizadas
- [x] `SecurityConfig` stateless com `JwtAuthFilter`

## O que falta implementar (MVP)

- [ ] CRUD de `AuditClient` (clientes auditados)
- [ ] CRUD de `AuditCycle` (ciclos de auditoria, com mudança de status)
- [ ] CRUD de `PbcItem` (itens de lista PBC, com workflow de status)
- [ ] Upload/download de `Document` (vinculado a PBC items)
- [ ] `Comment` em PBC items
- [ ] `AuditLog` (registro automático de ações importantes)
- [ ] Autorização por perfil nos endpoints (ADMIN vs AUDITOR vs CLIENTE)

## Convenções do projeto

- Nomes de campos em português (ex: `nomeEmpresa`, `senhaHash`, `criadoEm`)
- Colunas no banco em snake_case português (ex: `nome_empresa`, `senha_hash`, `criado_em`)
- Responses nunca expõem `senhaHash`
- Sempre usar `@Transactional` em métodos de escrita
- IDs são `UUID` gerados pelo banco (`GenerationType.UUID`)
- Datas usam `@CreationTimestamp` + `LocalDateTime`
- Erros retornam `ErrorResponse { status, message, timestamp }`

## Comandos úteis

```bash
# Rodar a aplicação
mvn spring-boot:run

# Build sem testes
mvn clean package -DskipTests
```
