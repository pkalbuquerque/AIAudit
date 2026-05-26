# Agente Testes — AuditFlow

## Cobertura atual

### ✅ Testes manuais via Postman
Collection: **"AuditFlow — Fase 2"** no Postman (workspace pessoal)  
38 requests organizados em 8 pastas, com test scripts e encadeamento automático de variáveis.

| Pasta | Cenários |
|-------|----------|
| 🔐 Auth | Register, Login, Credencial inválida (→ 401) |
| 👥 Clientes | CRUD + CLIENTE proibido (→ 403) |
| 👤 Usuários | CRUD + perfil CLIENTE (→ 400) + e-mail duplicado + sem token + AUDITOR proibido |
| 🔄 Ciclos | CRUD + filtros + transições de status |
| 📋 PBC Items | Criação + listagem por perfil + máquina de estados completa |
| 📎 Documentos | Upload + listagem + download |
| 💬 Comentários | Criação (ADMIN + CLIENTE) + listagem ordenada |
| 🔀 Status do Ciclo | Transições válidas e inválidas |

### ❌ Testes automatizados
Não implementados ainda. Ver "Próximos passos" abaixo.

---

## Cenários críticos obrigatórios

### Segurança
- `[401]` Login com senha errada retorna "Credenciais inválidas" (não revela se e-mail existe)
- `[401]` Login com e-mail inexistente retorna mesma mensagem
- `[403]` Request sem token retorna 403
- `[403]` CLIENTE tenta criar cliente
- `[403]` AUDITOR tenta criar usuário
- `[403]` CLIENTE tenta aprovar PBC item
- `[403]` Segregação: quem enviou não pode aprovar o mesmo item
- `[404]` Acesso a recurso de outro tenant retorna 404 (não 403)

### Regras de negócio
- `[400]` Criar usuário com perfil CLIENTE → mensagem orienta /api/clients
- `[400]` CNPJ duplicado no mesmo tenant
- `[400]` E-mail duplicado no sistema
- `[400]` Status do ciclo: ABERTO → ENCERRADO (pular EM_ANDAMENTO) → inválido
- `[400]` Status do ciclo: qualquer regressão → inválido
- `[400]` PBC item: PENDENTE → APROVADO (sem passar por ENVIADO) → inválido
- `[400]` Rejeitar sem motivoRejeicao → inválido
- `[200]` CLIENTE só vê PBC items onde é responsável
- `[200]` Comentários retornam ordenados por criado_em ASC

---

## Estrutura sugerida para testes unitários (JUnit 5 + Mockito)

```
src/test/java/com/auditflow/
  service/
    AuthServiceTest.java         ← login, register, credenciais inválidas
    AuditClientServiceTest.java  ← CRUD, CNPJ duplicado, criação de user CLIENTE
    AuditCycleServiceTest.java   ← transições de status
    PbcItemServiceTest.java      ← máquina de estados, segregação, visibilidade
    UserServiceTest.java         ← perfil CLIENTE bloqueado, e-mail duplicado
  security/
    JwtServiceTest.java          ← geração e validação de token
```

### Template de teste de service

```java
@ExtendWith(MockitoExtension.class)
class PbcItemServiceTest {

    @Mock PbcItemRepository pbcItemRepository;
    @Mock AuditCycleRepository auditCycleRepository;
    @InjectMocks PbcItemService pbcItemService;

    @BeforeEach
    void setUp() {
        // Setar TenantContext com UUID fixo de teste
        TenantContext.setTenantId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void updateStatus_quandoClienteAprovaDiretamente_deveLancar403() {
        // given
        PbcItem item = PbcItem.builder()
            .id(UUID.randomUUID())
            .tenantId(TenantContext.getTenantId())
            .status(PbcItemStatus.PENDENTE)
            .responsavelId(UUID.randomUUID())
            .build();

        // Mock do SecurityUtils para retornar user CLIENTE
        // ...

        // then
        assertThrows(AccessDeniedException.class, () ->
            pbcItemService.updateStatus(item.getId(), new UpdatePbcItemStatusRequest(PbcItemStatus.APROVADO, null))
        );
    }
}
```

---

## Próximos passos para testes automatizados

### Prioridade 1 — Testes de service (unitários)
- [ ] `AuthServiceTest` — cobrir login válido, inválido, register
- [ ] `PbcItemServiceTest` — cobrir toda a máquina de estados e segregação
- [ ] `AuditCycleServiceTest` — transições de status

### Prioridade 2 — Testes de integração (@SpringBootTest)
- [ ] Subir contexto completo com banco H2 ou Testcontainers (PostgreSQL)
- [ ] Testar controllers via `MockMvc`
- [ ] Testar isolamento de tenant (dados de tenant A não aparecem para tenant B)

### Dependências para adicionar ao pom.xml
```xml
<!-- Testcontainers para PostgreSQL real nos testes de integração -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
```

---

## Variáveis da collection Postman

Preenchidas automaticamente pelos test scripts:
`tokenAdmin`, `tokenCliente`, `tokenAuditor`, `adminUserId`, `clienteUserId`, `auditorId`,
`clientId`, `cycleId`, `pbcItemId`, `pbcItemIdRejeitar`, `pbcItemIdSegregacao`, `pbcItemIdDoc`,
`documentId`, `senhaProvisoria`

> Execute sempre em ordem — cada request depende dos IDs salvos pelo anterior.
