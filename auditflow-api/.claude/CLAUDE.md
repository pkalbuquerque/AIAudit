# AuditFlow — Contexto Global

## O que é

SaaS multi-tenant de gestão de auditorias. Escritórios de auditoria (Tenants) gerenciam clientes, ciclos de auditoria e itens PBC (Provided by Client). MVP em construção.

## Estrutura do repositório

```
auditflow-api/          ← API Spring Boot (este repositório)
.claude/
  CLAUDE.md             ← este arquivo (contexto global)
  agents/
    backend.md          ← API, regras de negócio, autenticação
    frontend.md         ← Portal do Auditor + Portal do Cliente
    database.md         ← Migrations, schemas, queries ORM
    testes.md           ← Testes unitários e de integração
```

## Perfis de usuário

| Perfil | Quem é | O que pode fazer |
|--------|--------|-----------------|
| ADMIN | Dono do escritório | Tudo dentro do tenant |
| AUDITOR | Membro do escritório | Gerencia ciclos e PBC items |
| CLIENTE | Empresa auditada | Vê e envia documentos dos seus PBC items |

## Fluxo de trabalho principal

```
Tenant criado via /register
  └─ ADMIN cria AuditClients (clientes auditados)
       └─ ADMIN/AUDITOR cria AuditCycles por cliente
            └─ ADMIN/AUDITOR cria PbcItems por ciclo
                 └─ CLIENTE envia documentos → AUDITOR aprova/rejeita
```

## Estado atual do MVP (2026-05-22)

**Fase 1 — Auth:** ✅ Completo  
**Fase 2 — Núcleo operacional:** ✅ Completo  
**Fase 3 — Frontend:** ⏳ Não iniciado  
**Fase 4 — AuditLog + Notificações:** ⏳ Não iniciado  

## Agentes especializados

Para tarefas específicas, carregue o agente correspondente:

- **Backend:** `.claude/agents/backend.md`
- **Frontend:** `.claude/agents/frontend.md`
- **Banco de dados:** `.claude/agents/database.md`
- **Testes:** `.claude/agents/testes.md`
