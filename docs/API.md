# Levity API

> Referência revisada em **2026-09-14** contra `levity-api@2eef9c7`.
> Controllers, schemas TypeBox e services são a fonte de verdade. A interface
> Swagger está disponível em `/docs`, mas a maioria das respostas ainda não tem
> schema OpenAPI declarado.

## Visão geral

- base local: `http://localhost:3001`;
- prefixo das rotas de produto: `/api`;
- autenticação: `Authorization: Bearer <accessToken>`;
- JSON externo em `snake_case`;
- enums em `UPPER_SNAKE_CASE`;
- `Content-Type: application/json`, exceto uploads multipart;
- respostas sem conteúdo usam 204;
- body e arquivo limitados a 10 MiB;
- rate limit somente em produção, default 100 requests/15 min.

Existem 63 rotas sob `/api`: duas públicas e 61 autenticadas.

## Rotas de serviço

| Método | Rota | Auth | Resposta |
| --- | --- | --- | --- |
| GET | `/` | não | `{ name, version, endpoints }` |
| GET | `/health` | não | `{ status, timestamp, environment }` |
| GET | `/docs` | não | Swagger UI |

## Autenticação

### `POST /api/auth/register`

Pública. Retorna 201.

```ts
type RegisterBody = {
  username: string; // 3..30
  password: string; // mínimo 5
  email?: string;   // email válido
};
```

Cria um avatar DiceBear externo e retorna o mesmo formato do login.

### `POST /api/auth/login`

Pública. Retorna 200.

```ts
type LoginBody = { username: string; password: string };
type AuthResponse = {
  accessToken: string;
  user: { id: string; username: string };
};
```

O JWT contém `{ id, username }`. `JWT_EXPIRES_IN` usa `24h` por default.
Contas suspensas recebem a mesma resposta 401 de credenciais inválidas.

## Usuários

| Método | Rota | Regra |
| --- | --- | --- |
| GET | `/api/users/me` | perfil do token |
| PATCH | `/api/users/me` | atualiza perfil do token |
| GET | `/api/users/?workspace_id=<uuid>&search=<texto>` | membro do workspace |

Sem `workspace_id`, a listagem devolve `[]`.

```ts
type UpdateUserBody = {
  first_name?: string; // até 50
  last_name?: string;  // até 50
  avatar_url?: string;
  bio?: string;        // até 500
  email?: string;
};

type UserSummary = {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
};

type UserResponse = UserSummary & {
  bio?: string;
  email?: string;
  account_status: "ACTIVE" | "SUSPENDED";
  updated_at: string;
  last_login_at?: string;
  created_at: string;
};
```

GET do perfil e listagem resolvem storage keys de avatar em URLs assinadas.
PATCH devolve o valor persistido diretamente.

## Workspaces e boards de navegação

Papéis de workspace: `OWNER`, `ADMIN`, `MEMBER`.

| Método | Rota | Regra | Status |
| --- | --- | --- | --- |
| GET | `/api/workspaces/` | autenticado | 200 |
| POST | `/api/workspaces/` | autenticado | 201 |
| PATCH | `/api/workspaces/:id` | OWNER/ADMIN | 200 |
| DELETE | `/api/workspaces/:id` | OWNER | 204 |
| GET | `/api/workspaces/:id/boards` | membro do workspace | 200 |
| POST | `/api/workspaces/:id/boards` | OWNER/ADMIN | 201 |
| PATCH | `/api/workspaces/:id/boards/:boardId` | OWNER/ADMIN | 200 |
| POST | `/api/workspaces/:id/boards/:boardId/self-grant` | OWNER/ADMIN | 200 |

Create/rename de workspace e board usam `{ name: string }` com 1..100 caracteres.
Criar workspace também cria:

- membership OWNER do criador;
- prioridades de sistema;
- um board com o nome do workspace;
- colunas `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`;
- membership ADMIN do criador no board.

```ts
type WorkspaceResponse = {
  id: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  created_by: string;
  created_at: string;
  updated_at: string;
};

type HomeBoardResponse = {
  id: string;
  workspace_id: string;
  name: string;
  position: number;
  role: "ADMIN" | "EDITOR" | "VIEWER";
};
```

GET boards retorna apenas boards em que o usuário tem membership ativa.
`self-grant` permite que OWNER/ADMIN do workspace restaure/crie para si uma
membership ADMIN em um board daquele workspace.

## Convites

| Método | Rota | Regra | Status |
| --- | --- | --- | --- |
| GET | `/api/workspaces/:id/invites` | OWNER/ADMIN | 200 |
| POST | `/api/workspaces/:id/invites` | OWNER/ADMIN | 201 |
| GET | `/api/workspaces/:id/invites/:token` | autenticado | 200 |
| POST | `/api/workspaces/:id/invites/:token/accept` | autenticado | 200 |
| DELETE | `/api/workspaces/:id/invites/:inviteId` | OWNER/ADMIN | 204 |

```ts
type GenerateInviteBody = {
  max_uses?: number; // default 1; 1..100
  expires_in_hours?: number; // 1..720
  workspace_role?: "OWNER" | "ADMIN" | "MEMBER"; // default MEMBER
  board_grants: Array<{
    board_id: string;
    board_role: "ADMIN" | "EDITOR" | "VIEWER";
  }>;
};

type WorkspaceInviteResponse = {
  id: string;
  workspace_id: string;
  token: string;
  created_by: string;
  max_uses: number;
  current_uses: number;
  expires_at?: string;
  revoked_at?: string;
  workspace_role: "OWNER" | "ADMIN" | "MEMBER";
  created_at: string;
  grants: Array<{ board_id: string; board_role: "ADMIN" | "EDITOR" | "VIEWER" }>;
};
```

`board_grants` precisa ter ao menos um board, não aceita board repetido e todos
os boards devem pertencer ao workspace. Aceitar o convite faz upsert das
memberships de workspace e board. A resposta é `WorkspaceMemberResponse`.

Observação: no código atual, GET/accept localizam o convite somente pelo token;
o `:id` da URL não é confrontado com `workspace_id`.

## Membros do workspace

| Método | Rota | Regra | Status |
| --- | --- | --- | --- |
| GET | `/api/workspaces/:id/members` | membro | 200 |
| PATCH | `/api/workspaces/:id/members/:memberId/role` | OWNER/ADMIN | 200 |
| DELETE | `/api/workspaces/:id/members/:memberId` | OWNER/ADMIN | 204 |

`memberId` é o **ID do usuário**, não o ID da membership. Update usa
`{ role: "OWNER" | "ADMIN" | "MEMBER" }`.

Admin não pode modificar owner nem promover alguém a ADMIN/OWNER. Ninguém pode
alterar a própria role ou remover a si mesmo; admin não pode remover owner.

```ts
type WorkspaceMemberResponse = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  membership_status: "ACTIVE" | "LEFT" | "REMOVED";
  joined_at: string;
  left_at?: string;
  last_accessed_at?: string;
  user?: { username: string; first_name?: string; last_name?: string; avatar_url?: string };
};
```

## Tags e prioridades

Leitura exige membership do workspace; mutação exige OWNER/ADMIN.

| Método | Rota | Status |
| --- | --- | --- |
| GET | `/api/workspaces/:id/tags` | 200 |
| POST | `/api/workspaces/:id/tags` | 201 |
| DELETE | `/api/workspaces/:id/tags/:tagId` | 204 |
| GET | `/api/workspaces/:id/priorities` | 200 |
| POST | `/api/workspaces/:id/priorities` | 201 |
| DELETE | `/api/workspaces/:id/priorities/:priorityId` | 204 |

```ts
type CreateTagBody = { name: string; color: `#${string}` };
type CreatePriorityBody = {
  name: string; color: `#${string}`; icon: string; position?: number;
};
```

Nome aceita 1..50, cor exige exatamente `#RRGGBB`, icon aceita 1..10 e position
é inteiro >= 0 com default 0. Prioridade de sistema não pode ser apagada e a
tentativa retorna 409.

Tags retornam `id`, `workspace_id`, `name`, `color`, `status`, `created_at` e
`updated_at`. Prioridades acrescentam `icon`, `position`, `code?` e `is_system`.

## Board, colunas e issues

Papéis de board: `ADMIN`, `EDITOR`, `VIEWER`. Todos podem ler; somente ADMIN e
EDITOR podem mutar.

| Método | Rota | Status |
| --- | --- | --- |
| GET | `/api/boards/:boardId` | 200 |
| POST | `/api/boards/:boardId/columns` | 201 |
| PATCH | `/api/boards/:boardId/columns/positions` | 204 |
| PATCH | `/api/boards/:boardId/columns/:columnId` | 200 |
| DELETE | `/api/boards/:boardId/columns/:columnId` | 204 |
| POST | `/api/boards/:boardId/issues` | 201 |
| PATCH | `/api/boards/:boardId/issues/positions` | 204 |
| PATCH | `/api/boards/:boardId/issues/:issueId` | 200 |
| DELETE | `/api/boards/:boardId/issues/:issueId` | 204 |
| GET | `/api/boards/:boardId/issues/:issueId/history` | 200 |

```ts
type CreateColumnBody = {
  title: string; // 1..100
  position?: number; // default 0
  wip_limit?: number | null; // inteiro > 0
  column_type?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | null;
};
type UpdateColumnBody = Partial<CreateColumnBody>;
type ColumnPositionBody = Array<{ id: string; position: number }>;

type CreateIssueBody = {
  content: string; // 1..500
  column_id: string;
  position?: number; // default 0
  description?: string | null; // até 10.000
  priority_id?: string;
  tag_id?: string;
  assignee_id?: string;
  story_points?: number; // inteiro >= 0
  estimated_hours?: number; // > 0
};

type UpdateIssueBody = {
  content?: string;
  description?: string | null;
  cover_url?: string | null;
  assignee_id?: string | null;
  priority_id?: string;
  tag_id?: string | null;
  progress?: number | null; // inteiro 0..100
  due_date?: string | null; // date-time
  column_id?: string;
  position?: number;
  story_points?: number | null;
  estimated_hours?: number | null;
};
type IssuePositionBody = Array<{ id: string; position: number; column_id?: string }>;
```

GET board retorna:

```ts
type BoardDataResponse = {
  board: {
    id: string; workspace_id: string; name: string; position: number;
    created_by: string; created_at: string; updated_at: string;
  };
  columns: Array<{
    id: string; board_id: string; title: string; position: number;
    wip_limit?: number; column_type?: string;
    created_by: string; created_at: string;
    issues: IssueResponse[];
  }>;
};

type IssueResponse = {
  id: string; content: string; position: number;
  description?: string; cover_url?: string; assignee_id?: string;
  priority_id: string; tag_id?: string; progress?: number; due_date?: string;
  column_id: string; created_by: string; created_at: string;
  comment_count: number; story_points?: number; estimated_hours?: number;
};
```

O snapshot não inclui membros, tags ou prioridades. Use as rotas do workspace.
Cover é resolvida em URL temporária. A API aplica WIP na criação e nos moves.
Tag/prioridade precisam pertencer ao workspace; prioridade omitida usa o item
de sistema com código `medium`.

Histórico retorna `{ id, issue_id, created_by, action_type, field, old_val?,
new_val?, created_at, users? }`.

## Sprints

Leitura exige membership no board; mutação exige ADMIN/EDITOR.

| Método | Rota | Status |
| --- | --- | --- |
| GET | `/api/boards/:boardId/sprints` | 200 |
| GET | `/api/boards/:boardId/sprints/active` | 200 |
| GET | `/api/boards/:boardId/sprints/:sprintId` | 200 |
| POST | `/api/boards/:boardId/sprints` | 201 |
| PATCH | `/api/boards/:boardId/sprints/:sprintId` | 200 |
| DELETE | `/api/boards/:boardId/sprints/:sprintId` | 204 |
| POST | `/api/boards/:boardId/sprints/:sprintId/activate` | 200 |
| POST | `/api/boards/:boardId/sprints/:sprintId/complete` | 200 |
| POST | `/api/boards/:boardId/sprints/:sprintId/issues` | 201 |
| PATCH | `/api/boards/:boardId/sprints/:sprintId/issues/reorder` | 204 |
| DELETE | `/api/boards/:boardId/sprints/:sprintId/issues/:issueId` | 204 |

```ts
type CreateSprintBody = {
  name: string; goal?: string; start_date: string; end_date: string;
  tracking_mode: "POINTS" | "COUNT" | "HOURS";
  capacity_points?: number;
};
type CompleteSprintBody = { to_sprint_id?: string };
type AddIssueBody = { issue_id: string; position?: number };
type ReorderIssuesBody = Array<{ id: string; position: number }>;
```

Sprint retorna `board_id`, status `PLANNING|ACTIVE|COMPLETED`, tracking mode,
capacidade/velocidade opcionais e métricas `total_issues`, `completed_issues`,
`progress_percent`. O detalhe acrescenta `issues` com a associação e um resumo
da issue.

Somente PLANNING pode ser ativada/excluída; existe uma ACTIVE por board; somente
ACTIVE pode ser concluída. Carry-over usa `to_sprint_id` do mesmo board.

## Comentários

Leitura aceita qualquer membro do board. Create/update/delete exigem escrita no
board; update/delete também são limitados ao autor no repository.

| Método | Rota | Status |
| --- | --- | --- |
| GET | `/api/comments/?issue_id=<uuid>&limit=20&cursor=...` | 200 |
| GET | `/api/comments/:id/replies` | 200 |
| POST | `/api/comments/` | 201 |
| PATCH | `/api/comments/:id` | 200 |
| DELETE | `/api/comments/:id` | 204 |

Create usa `{ issue_id, content, parent_id? }`; update usa `{ content }`.
Conteúdo aceita 1..5000. A página retorna `{ data, nextCursor? }`.

Menções `@username` notificam apenas memberships ativas no board. Reply notifica
o autor do comentário pai. O mapper atual não preenche `user` nem `replies` no
objeto retornado; use o endpoint dedicado para replies.

## Notificações

| Método | Rota | Status |
| --- | --- | --- |
| GET | `/api/notifications/` | 200 |
| PATCH | `/api/notifications/:id/read` | 204 |
| POST | `/api/notifications/read-all` | 204 |

Query: `read?`, `cursor?` date-time, `page` default 1 e `limit` default 20/máximo
50. Com cursor retorna `{ items, limit, nextCursor? }`; sem cursor retorna
`{ items, total, page, limit, totalPages }`.

Item: `{ id, user_id, actor_id?, issue_id?, type, read, created_at }`, com type
`MENTION|ASSIGNMENT|REPLY|COMMENT`.

## Diagramas

Leitura aceita membro do board; save/delete exigem ADMIN/EDITOR.

| Método | Rota | Status |
| --- | --- | --- |
| GET | `/api/diagrams/:issueId` | 200, inclusive `null` |
| PUT | `/api/diagrams/` | 200 |
| DELETE | `/api/diagrams/:issueId` | 204 |

PUT usa `{ issue_id, data: { elements } }`. Máximo de 1000 elementos e 2500
pontos por elemento. Geometria usa `width`/`height`; pontos aceitam somente
`{ x, y }`. Tipos: `path`, `rect`, `circle`, `db`, `cloud`, `server`, `user`,
`arrow`, `line`, `eraser`.

## Arquivos

MIME aceitos: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.

| Método | Rota | Regra | Status |
| --- | --- | --- | --- |
| POST | `/api/files/attachments` | membro do workspace | 201 |
| POST | `/api/files/avatar` | autenticado | 201 |
| DELETE | `/api/files/attachments` | membro + key do workspace | 204 |
| GET | `/api/files/:workspaceName/:workspaceId/:category/:fileName` | auth; membership para attachment | 200 |

Attachment multipart usa `file` + campo textual `workspace_id`; avatar usa
`file`. Ambos retornam `{ url, publicId }`. Attachment é comprimido e salvo em
`<workspaceId>/attachments/<userId>_<uuid>.<ext>`. Avatar vira WebP 256×256,
salvo em `avatars/<userId>.webp` e a key é persistida no usuário.

Delete usa JSON `{ workspace_id, key }` e exige prefixo `<workspaceId>/`.
GET retorna uma string JSON contendo URL assinada. `workspaceName` não participa
da resolução da key no service atual.

## Erros

Erros de domínio e validação:

```json
{ "error": "mensagem", "code": "CODIGO" }
```

| HTTP | Code usual |
| --- | --- |
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 422 | `UNPROCESSABLE_ENTITY` |
| 429 | resposta específica do rate limiter |
| 500 | body sem `code`: `{ "error": "Internal server error" }` |

Rota desconhecida é uma exceção de formato:

```json
{ "message": "Route not found", "path": "/caminho" }
```

## Matriz de permissão

| Recurso | Leitura | Escrita/gestão |
| --- | --- | --- |
| workspace | membro ativo | rename OWNER/ADMIN; delete OWNER |
| boards do workspace | membro do workspace, mas só memberships de board próprias são listadas | create/rename/self-grant OWNER/ADMIN |
| board/column/issue | ADMIN/EDITOR/VIEWER do board | ADMIN/EDITOR do board |
| sprint | ADMIN/EDITOR/VIEWER do board | ADMIN/EDITOR do board |
| comment | ADMIN/EDITOR/VIEWER do board | ADMIN/EDITOR e autor para update/delete |
| diagram | ADMIN/EDITOR/VIEWER do board | ADMIN/EDITOR do board |
| tags/priorities | membro do workspace | OWNER/ADMIN do workspace |
| members/invites | members: membro; invites: OWNER/ADMIN | OWNER/ADMIN com restrições do service |
| attachment | membro do workspace | membro do workspace |

Workspace role não concede automaticamente acesso a todos os boards. Board role
não autoriza administração do workspace.

## Limitações conhecidas do contrato atual

- não há endpoint para excluir board;
- não há endpoint para listar, alterar ou remover board memberships; elas entram
  por create board, accept invite e self-grant;
- notificações não trazem `board_id`/`workspace_id`, ator expandido ou conteúdo;
- GET/accept invite não confrontam o `:id` da URL com o workspace do token;
- delete de tag/prioridade autoriza o workspace da URL, mas o service não valida
  que o recurso pertence àquele workspace;
- o parâmetro `workspaceName` da rota de download não participa da resolução;
- responses ainda não estão declaradas de forma abrangente no OpenAPI.

## Manutenção desta referência

Toda mudança em `src/modules/**/*controller.ts`, `src/contracts`, DTOs, enums ou
guards deve atualizar este arquivo e os testes E2E correspondentes no mesmo PR.
Mudanças consumidas pelo frontend também atualizam
`levity-web/docs/frontend-migration/API_CONTRACTS.md`.
