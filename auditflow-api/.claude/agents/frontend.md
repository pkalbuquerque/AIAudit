# Agente Frontend — AuditFlow Portais

## Status

⏳ **Não iniciado** — este agente descreve o que precisa ser construído.

## Stack planejada

- React 18 + Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (componentes)
- React Query (TanStack Query) para cache e fetching
- React Hook Form + Zod para formulários
- Axios para HTTP

## Dois portais

O frontend terá dois portais separados, mas podem ser no mesmo projeto Next.js:

```
/app
  /(auditor)/         ← Portal do Auditor (ADMIN + AUDITOR)
  /(cliente)/         ← Portal do Cliente (CLIENTE)
  /auth/              ← Login compartilhado
```

---

## Portal do Auditor (ADMIN + AUDITOR)

### Páginas

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Visão geral: clientes, ciclos abertos, itens pendentes |
| `/clients` | Lista de clientes auditados |
| `/clients/new` | Criar cliente + usuário CLIENTE |
| `/clients/[id]` | Detalhe do cliente e seus ciclos |
| `/cycles` | Todos os ciclos (com filtros por status/cliente) |
| `/cycles/new` | Criar ciclo |
| `/cycles/[id]` | Detalhe do ciclo e PBC items |
| `/cycles/[id]/pbc/new` | Criar PBC item |
| `/pbc/[id]` | Detalhe do item: status, documentos, comentários |
| `/users` | Gestão de usuários (ADMIN only) |
| `/users/new` | Criar ADMIN ou AUDITOR |

### Funcionalidades chave

- Avançar status do ciclo (ABERTO → EM_ANDAMENTO → ENCERRADO)
- Aprovar / rejeitar PBC items (com campo motivoRejeicao obrigatório)
- Download de documentos enviados pelo cliente
- Thread de comentários em cada PBC item
- Badge de status nos itens (cores: PENDENTE=amarelo, ENVIADO=azul, APROVADO=verde, REJEITADO=vermelho)

---

## Portal do Cliente (CLIENTE)

### Páginas

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Itens PBC pendentes/rejeitados que precisam de ação |
| `/cycles/[id]` | Ver ciclo e seus itens (só os atribuídos ao CLIENTE logado) |
| `/pbc/[id]` | Detalhe: ver status, enviar documento, adicionar comentário |

### Funcionalidades chave

- Upload de arquivo (multipart) para PBC item → muda status para ENVIADO
- Ver motivo de rejeição quando item for REJEITADO
- Reenviar após rejeição
- Thread de comentários

---

## Autenticação (JWT)

```typescript
// Ao fazer login:
// POST /api/auth/login → { token, usuario: { id, perfil, tenantId } }

// Guardar no localStorage ou cookie httpOnly
// Enviar em todas as requisições:
headers: { Authorization: `Bearer ${token}` }

// Redirecionar por perfil após login:
// ADMIN → /dashboard (portal auditor)
// AUDITOR → /dashboard (portal auditor)
// CLIENTE → /dashboard (portal cliente)
```

## Integração com a API

- Base URL: `http://localhost:8080` em dev
- Todos os endpoints autenticados precisam do header `Authorization: Bearer {token}`
- Erros seguem formato: `{ status: number, erro: string, timestamp: string }`
- Upload de documentos: `multipart/form-data` com campo `file`

## Variáveis de ambiente (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Regras de UX

- CLIENTE nunca vê o botão de Aprovar/Rejeitar
- CLIENTE só vê itens onde é responsável
- AUDITOR não vê a aba de gestão de usuários
- Status do ciclo ENCERRADO = somente leitura (sem criar novos PBC items)
