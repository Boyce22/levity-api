---
name: melhorar-testes
description: >-
  Atualiza e amplia testes Vitest (E2E HTTP e unitários) sempre que código novo
  ou alterado entra na Levity API. Use ao implementar endpoint, schema, regra de
  acesso, service, bugfix ou comportamento observável; ao o usuário pedir
  feature, correção, refatoração com mudança de contrato, ou melhoria da suíte.
---

# Melhorar testes

Toda mudança de comportamento **termina com testes**. Implementação sem cenário correspondente não está pronta.

## Quando aplicar

- Rota, schema TypeBox, service, regra de acesso, status HTTP ou payload mudou
- Bug corrigido (reproduzir o falha antes ou no mesmo PR)
- Factory/helper insuficiente para o fluxo novo

Não adie testes para “depois”. Não cubra só o happy path. **Toda alteração em controller, service ou repository exige cenário que execute essa camada** — E2E via `api()` já atravessa as três; não deixe método novo só no service/repository sem teste.

## Onde escrever

| Mudança | Arquivo |
|---|---|
| Endpoint `/api/<recurso>` | `tests/e2e/<categoria>.test.ts` (criar arquivo se a categoria for nova) — cobre controller + service + repository |
| `*.controller.ts` / `*.service.ts` / `*.repository.ts` | Obrigatório: pelo menos um cenário que chame o fluxo (não deixar arquivo novo a 0%) |
| Schema / middleware / util puro | `tests/contracts/**` ou `tests/modules/**` / `tests/shared/**` |
| Upload multipart | `tests/e2e/files.test.ts` + `uploadMultipart` |

Categorias atuais: `health`, `auth`, `users`, `workspaces`, `workspaces-invites`, `workspaces-members`, `workspaces-settings`, `boards`, `sprints`, `comments`, `notifications`, `diagrams`, `files`.

## Como escrever

1. Importar `./setup` em todo E2E (sobe o app, `TRUNCATE`, limpa storage).
2. Usar `api()` / `uploadMultipart()` e factories em `tests/helpers/factories.ts`. Estender factories em vez de copiar setup (registrar, workspace, board, issue, convite).
3. Agrupar por rota: `describe('METHOD /path')`.
4. `it(...)` em **português**, semântico (comportamento, não status):
   - Bom: `it('rejeita o cadastro quando o username já está em uso')`
   - Ruim: `it('retorna 409')`, `it('works')`, `it('test login')`
5. Por rota nova ou alterada, cobrir o que existir no contrato:
   - feliz (status e campos relevantes)
   - auth (`401` sem token / token inválido)
   - validação (`422` no schema)
   - autorização (`403` papel insuficiente)
   - domínio (`400` / `404` / `409` que o service já lança)
6. Nomes únicos via `unique('prefixo')`. Sem dados fixos que colidam entre testes.
7. Assertar `status` **e** corpo (`code`, campos de negócio). Evite só `toBeTruthy()` no payload inteiro.
8. Rodar o recorte: `npx vitest run tests/e2e/<arquivo>.test.ts`. Corrigir falhas antes de declarar pronto.
9. Antes de encerrar uma mudança em `src/`, `npm test` (com coverage). Limiar **80%** global e **80%** nos globs de controller, service e repository. Se cair, acrescente cenários — não baixe o threshold e não exclua `*.controller.ts` / `*.service.ts` / `*.repository.ts`.

## Qualidade

- Um cenário = uma regra. Não misturar 401 e 422 no mesmo `it`.
- Não mockar service/DB no E2E. Storage continua `InMemoryStorage`.
- Não truncar a tabela `migrations`. Não apontar testes para o DB `levity` de desenvolvimento.
- Não editar produção só para “fazer o teste passar”, salvo bug real exposto pelo cenário.

## Exemplo

```ts
describe('POST /api/auth/register', () => {
  it('cria a conta e devolve o token de acesso quando os dados são válidos', async () => {
    const username = unique('ada');
    const response = await api('POST', '/api/auth/register', {
      body: { username, password: 'secret1', email: `${username}@levity.test` },
    });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ user: { username } });
  });
});
```
