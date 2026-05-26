# Agente Backend — AuditFlow API

## Stack

- Java 21, Spring Boot 3.3.6, Maven
- Spring Web, Spring Data JPA, Spring Security (stateless JWT)
- PostgreSQL via Supabase (Transaction Pooler, IPv4, sa-east-1)
- Lombok, Bean Validation, Auth0 java-jwt 4.4.0

## Estrutura de pacotes (`com.auditflow`)

```
config/
  SecurityConfig.java         ← CORS, stateless, BCrypt, @EnableMethodSecurity

controller/
  AuthController.java         ← POST /api/auth/register, /login
  UserController.java         ← GET/POST /api/users (ADMIN only)
  AuditClientController.java  ← CRUD /api/clients
  AuditCycleController.java   ← CRUD /api/cycles
  PbcItemController.java      ← CRUD /api/cycles/{id}/pbc e /api/pbc/{id}
  DocumentController.java     ← upload/download /api/pbc/{id}/documents
  CommentController.java      ← /api/pbc/{id}/comments

domain/
  entity/    → Tenant, User, AuditClient, AuditCycle, PbcItem, Document, Comment, AuditLog
  enums/     → Perfil (ADMIN, AUDITOR, CLIENTE)
             → CycleStatus (ABERTO, EM_ANDAMENTO, ENCERRADO)
             → PbcItemStatus (PENDENTE, ENVIADO, APROVADO, REJEITADO)
  repository/ → 8 JpaRepositories com queries por tenantId

dto/
  request/   → Register, Login, CreateAuditClient, UpdateAuditClient,
               CreateAuditCycle, UpdateCycleStatus, CreatePbcItem,
               UpdatePbcItemStatus, CreateUser, CreateComment
  response/  → Auth, User, AuditClient, AuditCycle, PbcItem, Document, Comment

exception/
  UnauthorizedException.java   → 401
  GlobalExceptionHandler.java  → handlers para 400/401/403/404/500 com @Slf4j
  ErrorResponse.java           → { status, erro, timestamp }

security/
  JwtService.java       ← gera/valida JWT com claims: sub, tenantId, perfil, userId
  JwtAuthFilter.java    ← extrai token → TenantContext → SecurityContext (@Slf4j)
  TenantContext.java    ← ThreadLocal<UUID> para tenantId
  SecurityUtils.java    ← getCurrentUser() via SecurityContextHolder

service/
  AuthService.java, UserService.java, AuditClientService.java
  AuditCycleService.java, PbcItemService.java
  StorageService.java (interface), LocalFileStorageService.java
  DocumentService.java, CommentService.java
```

## Endpoints implementados

### Auth (público)
```
POST /api/auth/register   → cria Tenant + ADMIN em @Transactional → JWT
POST /api/auth/login      → valida BCrypt → JWT
```

### Usuários (ADMIN)
```
POST /api/users           → cria ADMIN ou AUDITOR (CLIENTE proibido aqui)
GET  /api/users           → lista todos do tenant
GET  /api/users/{id}      → detalhe
```

### Clientes (ADMIN, AUDITOR)
```
POST /api/clients         → cria AuditClient + User(CLIENTE) em @Transactional
                            retorna senhaProvisoria gerada automaticamente
GET  /api/clients         → lista do tenant
GET  /api/clients/{id}    → detalhe
PUT  /api/clients/{id}    → edita nomeEmpresa / cnpj
```

### Ciclos (ADMIN, AUDITOR)
```
POST  /api/cycles                  → cria ciclo, auditorId = currentUser
GET   /api/cycles?status=&auditClientId=  → lista com filtros opcionais
GET   /api/cycles/{id}             → detalhe
PATCH /api/cycles/{id}/status      → avança status (só na ordem: ABERTO→EM_ANDAMENTO→ENCERRADO)
```

### PBC Items
```
POST  /api/cycles/{cycleId}/pbc    → cria item (ADMIN, AUDITOR)
GET   /api/cycles/{cycleId}/pbc    → ADMIN/AUDITOR vê todos; CLIENTE só os seus
GET   /api/pbc/{id}                → detalhe
PATCH /api/pbc/{id}/status         → máquina de estados (ver abaixo)
```

### Documentos
```
POST /api/pbc/{pbcItemId}/documents   → upload multipart (CLIENTE); seta item = ENVIADO
GET  /api/pbc/{pbcItemId}/documents   → lista
GET  /api/documents/{id}/download     → download como Resource
```

### Comentários
```
POST /api/pbc/{pbcItemId}/comments   → qualquer perfil autenticado
GET  /api/pbc/{pbcItemId}/comments   → lista ordenada por criado_em ASC
```

## Máquina de estados — PbcItem

```
PENDENTE
  ├─ CLIENTE → ENVIADO       (só CLIENTE pode enviar; PENDENTE ou REJEITADO → ENVIADO)
  └─ ENVIADO
       ├─ ADMIN/AUDITOR → APROVADO   (quem é responsavelId NÃO pode aprovar — segregação)
       └─ ADMIN/AUDITOR → REJEITADO  (motivoRejeicao obrigatório)
            └─ CLIENTE → ENVIADO     (reenvio após rejeição)
```

## Regras de ouro — sempre aplicar

1. **`tenantId` vem SEMPRE do `TenantContext`** — nunca de parâmetro de URL ou body
2. **Data leak:** se recurso não pertencer ao tenant → retornar 404 (não 403)
3. **Autorizações:** usar `@PreAuthorize("hasAuthority('ADMIN')")` — authorities sem prefixo ROLE_
4. **Escrita:** sempre `@Transactional` em métodos de service que fazem mutações
5. **Erros de autenticação:** sempre mesma mensagem genérica (não revelar se e-mail existe)

## Convenções de código

```
- Campos Java: camelCase português (nomeEmpresa, senhaHash, criadoEm)
- Colunas DB: snake_case português (nome_empresa, senha_hash, criado_em)
- IDs: UUID gerados pelo banco via GenerationType.UUID
- Timestamps: @CreationTimestamp + LocalDateTime
- Response nunca expõe senhaHash
- Lombok: @Data @Builder @NoArgsConstructor @AllArgsConstructor nas entidades
- Services: @Slf4j para logging (WARN em violações de negócio, ERROR em 500)
```

## Variáveis de ambiente

```
SUPABASE_DB_PASSWORD=<senha do banco>
JWT_SECRET=<string longa para assinar tokens>
```

IntelliJ → Run → Edit Configurations → Environment variables

## Comandos

```bash
mvn spring-boot:run            # rodar
mvn clean package -DskipTests  # build sem testes
```

## Próximos passos (Fase 3+)

- AuditLog: registrar automaticamente ações importantes via AOP ou event
- Notificações: e-mail ao CLIENTE quando item é criado/rejeitado
- Paginação nos endpoints de listagem
- Refresh token
