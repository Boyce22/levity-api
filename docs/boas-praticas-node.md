# Boas práticas — API Node.js (Levity)

Guia genérico para uma API HTTP em Node.js: organizada, testável e barata de operar. Independente de produto. Trate `@levity` como o scope npm do projeto.

Não é um tutorial de TypeScript. São as decisões que evitam monolito acidental, N+1 e processo único que mistura HTTP com trabalho pesado.

---

## 1. Princípios

1. **Processos magros.** O processo HTTP não executa jobs longos (e-mail em massa, PDF, importação, chamadas lentas a terceiros). Cada runtime carrega só o que precisa.
2. **Uma direção de dependência.** O domínio não conhece ORM, Fastify ou Redis. Quem inverte isso acopla o resto do sistema.
3. **Wiring explícito.** Sem container de DI. Cada app tem um `composition-root.ts` que instancia logger, repositórios, services e rotas.
4. **Validar na borda, calcular no centro.** TypeBox nos schemas; regras de negócio em funções puras ou services; persistência só persiste.
5. **Fail-closed.** Env inválido, body inválido, falha de integração crítica: o processo **não finge sucesso**.
6. **Hot path é bug.** Lista sem paginação, insert em loop, pool default e `Promise.all` ilimitado não são “depois”.

---

## 2. Layout

npm workspaces. TypeScript com **project references** (`tsc -b`). Imports internos só via `@levity/*`.

```text
repo/
├── apps/
│   ├── api/                 # HTTP — sempre ligado, imagem magra
│   └── worker/              # opcional — um processo por tipo de trabalho
├── packages/
│   ├── domain/              # enums, TypeBox, DTOs, payloads de job — zero I/O
│   ├── config/              # env TypeBox + cliente Redis
│   ├── observability/       # logger, erros tipados, validateDto, lifecycle
│   ├── persistence/         # entities, repos, DataSource, migrations
│   ├── application/         # services de negócio + ports
│   ├── queues/              # produtores de fila (quando existir worker)
│   └── <adapters>/          # clientes HTTP, e-mail, storage, pagamento
├── tsconfig.json            # só "references"
├── tsconfig.base.json
├── eslint.config.mjs
└── .github/workflows/ci.yml
```

**Apps** são deployáveis. **Packages** são bibliotecas. Um package nunca importa um app.

Comece com `api` + `domain` + `application` + `persistence` + `config` + `observability`. Crie `worker`, `queues` e adapters **quando um caso de uso deixar de caber no request HTTP** (mais que ~300 ms, I/O em lote, retry, ou binário externo).

---

## 3. Separação de responsabilidades

### 3.1 Camadas

| Camada | Pode | Não pode |
|---|---|---|
| **domain** | Tipos, enums, TypeBox, funções puras (cálculo, status, IDs estáveis) | TypeORM, Fastify, Redis, `fs`, `fetch` |
| **application** | Orquestrar casos de uso; chamar repos e ports | Conhecer Fastify, a lib de fila concreta, SDKs de terceiros |
| **persistence** | Entities, queries, migrations | Regras de negócio, schemas HTTP |
| **adapters** | I/O com o mundo externo (SMTP, S3, gateway de pagamento) | Conhecer controllers ou entities |
| **queues** | Nomes de fila, producers, política de retenção | Lógica de domínio |
| **apps** | Composition root + transporte (HTTP ou worker) | Regras que outro runtime também precisa |

Organize `application` e rotas por **agregado** (`orders`, `customers`, `catalog`), não por verbo HTTP.

### 3.2 Grafo de dependências (obrigatório)

```text
domain              →  (nada interno; só TypeBox)
config              →  TypeBox, dotenv, ioredis
observability       →  pino, TypeBox
persistence         →  domain, config
application         →  domain, persistence, observability
queues              →  domain, config
adapters            →  domain, observability, config

api                 →  application, queues, persistence, config, observability, domain
                       (+ adapters de leitura, se o request precisar)
worker              →  application, queues, persistence, config, observability, domain
                       (+ adapters de trabalho)
```

Regras duras:

- `domain` **nunca** importa outro `@levity/*`.
- `application` fala com filas e HTTP externos via **port** (interface). O composition root injeta a implementação.
- Controllers são **finos**: autenticar → `validateDto(schema, body)` → service → status HTTP.
- Repositórios encapsulam o ORM. Services não montam `QueryBuilder`.

### 3.3 Composition root

Cada app tem o seu. Nada de service locator global.

```ts
export function createApiContainer() {
  const logger = createLogger({
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV !== 'production',
  });

  const orderService = new OrderService(
    new OrderRepository(AppDataSource.getRepository(Order)),
    logger.child({ name: 'orders' }),
  );

  return {
    logger,
    plugins: {
      orders: orderRoutes(orderService, authenticate),
    },
    async close() {
      /* fechar Redis, filas, etc. */
    },
  };
}
```

- A API **não** instancia o worker, o cliente de e-mail em massa, nem SDKs que só o job usa.
- O worker **não** instancia Fastify.
- No `import` time só existem `env` (já validado) e o `DataSource` (ainda sem `initialize`).

### 3.4 Port

Quando o service precisa de um efeito colateral (fila, e-mail, pagamento), declare a interface no `application`:

```ts
export interface MailScheduler {
  scheduleOrderConfirmation(orderId: string): Promise<void>;
}
```

A implementação (`MailQueue` ou `SmtpMailer`) vive em `queues` ou num adapter. O root injeta. Testes do service usam um fake.

### 3.5 Fluxo de um request

```text
HTTP → plugins (helmet, cors, compress, cookie, rate-limit)
     → preHandler (JWT / API key)
     → controller: validateDto(typeBoxSchema, body|query)
     → application service
     → repository  |  port (fila / adapter)
     → AppError tipado  → error handler  → { message, errors? }
```

Controller típico:

```ts
fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
  const dto = validateDto(createOrderSchema, request.body);
  const data = await service.create(dto);
  reply.status(201);
  return data;
});
```

---

## 4. Bibliotecas

Uma lib por papel. Antes de adicionar dependência: o Node nativo ou um package interno já resolve?

| Papel | Escolha | Por quê | Evite |
|---|---|---|---|
| Runtime | Node **20+** | `node:test`, `--watch`, source maps, `fetch` | Node 18 “porque funciona” |
| Linguagem | TypeScript **strict** + `composite` | Build incremental por package | `any`; `skipLibCheck` como desculpa |
| HTTP | **Fastify 5** | Throughput, plugins estáveis | Express + dezena de middlewares |
| Validação | **TypeBox** (única fonte) | Env, body, query, payloads de job | class-validator + DTO duplicado |
| Logs | **Pino** | JSON, `child({ module })` | `console.log` em produção |
| ORM | **TypeORM** + Postgres | Entities + migrations | `synchronize: true` em prod |
| Fila | **BullMQ** + Redis | Retry, concurrency, retenção | `setTimeout` / fila caseira |
| Cache / sessão | **ioredis** | Auth cache, locks leves | bater no Postgres em todo request |
| HTTP de saída | `fetch` nativo ou cliente fino | Menos superfície | axios “por costume” |
| Concorrência | `p-limit` | Bound em fan-out (webhooks, e-mails, APIs) | `Promise.all` ilimitado |
| Testes | **`node:test` + `node:assert/strict`** | Zero runner extra no backend | Jest/Vitest só para unit puro |
| Lint | ESLint 9 flat + `typescript-eslint` | `no-explicit-any`, type-imports | regras que ninguém cumpre |
| Auth HTTP | JWT + Helmet + rate-limit | Borda segura sem framework extra | Passport se 1 middleware basta |
| Hash de senha | `bcryptjs` | Padrão suficiente | inventar crypto |
| Compressão | `@fastify/compress` | Respostas menores | comprimir binários no worker |

### 4.1 Env por papel de runtime

Valide **uma vez** na subida com TypeBox. Campos obrigatórios **mudam com `RUNTIME_ROLE`**:

| Papel | Precisa |
|---|---|
| `api` | `JWT_*`, `CORS_ORIGINS`, `PORT` |
| `worker` | credenciais do trabalho (SMTP, S3, gateway) |
| `db-bootstrap` | só `DB_*` |

Pool do Postgres também é por papel (a API segura mais conexões que o worker):

```text
api: 10    worker: 5    db-bootstrap: 2
```

Override: `DB_POOL_MAX`.

### 4.2 O que não colocar no `package.json`

- Nest / Adonis — o composition root já é o IoC.
- Lodash / moment — stdlib + `Intl`.
- Dois ORMs no mesmo app.
- Segundo logger além do Pino.
- Test runner extra no backend, salvo se precisar de jsdom (aí é front).

---

## 5. Qualidade

### 5.1 TypeScript

`tsconfig.base.json` (mínimo):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "composite": true,
    "incremental": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}
```

O `tsconfig.json` da raiz só lista `references` na **ordem topológica** (`domain` → `config` → … → `apps`).

### 5.2 ESLint

- `@typescript-eslint/no-explicit-any`: **error**
- `consistent-type-imports`: **error**
- `no-unused-vars` ignora prefixo `_`
- Preferir `AppError` a `new Error()` (warn até migrar call sites)

### 5.3 Testes

- Ao lado do código: `foo.ts` + `foo.test.ts`
- Funções puras (cálculo, transição de status, parse) **sem DB**
- Ports permitem fake no service
- Por package: `node --test --require ts-node/register src/**/*.test.ts`
- Na raiz: `npm test --workspaces --if-present`

Não exija cobertura 100%. Exija testes no núcleo que erra caro: schemas de entrada, regras de dinheiro/estoque/status, concorrência de fila.

### 5.4 Erros

Uma hierarquia em `observability`:

| Classe | Status |
|---|---|
| `BadRequestError` | 400 |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `UnprocessableEntityError` / `ValidationError` | 422 |
| `TooManyRequestsError` | 429 |
| `ExternalServiceError` | 502 |

Error handler HTTP:

- `AppError` → status + `{ message, errors }`
- resto → log `error` + **500 genérico** (não vazar stack)

### 5.5 Validação

```ts
export function validateDto<S extends TSchema>(schema: S, data: unknown): StaticDecode<S> {
  try {
    return Value.Parse(['Clone', 'Clean', 'Default', 'Assert', 'Decode'], schema, data) as StaticDecode<S>;
  } catch (error) {
    throw new UnprocessableEntityError(formatTypeBoxErrors(error));
  }
}
```

Paginação padrão (nunca lista unbounded):

```ts
export const paginationSchema = Type.Object({
  page: coerceNumberSchema({ integer: true, min: 1, defaultValue: 1 }),
  limit: coerceNumberSchema({ integer: true, min: 1, max: 100, defaultValue: 20 }),
});
```

### 5.6 Lifecycle

Todo `main.ts`:

1. `createXxxContainer()`
2. `dataSource.initialize()`
3. start HTTP **ou** Worker
4. `SIGTERM` / `SIGINT` → fecha server/worker → `dataSource.destroy()`
5. `uncaughtException` / `unhandledRejection` → fatal + shutdown com exit 1

### 5.7 CI

Ordem fixa, timeout curto (~15 min):

```text
npm ci  →  lint  →  build  →  test
```

Se o build quebra, o teste não roda. Sem skip de hook.

### 5.8 Persistência

- `synchronize: false` (exceto bootstrap local explícito e descartável)
- Migrations versionadas em `persistence`
- Índice nas colunas de filtro quente (`customerId`, `status`, `createdAt`)
- Unique onde a regra exige identidade estável (`(customer_id, external_ref)`)
- Logging SQL **só fora de produção**

---

## 6. Performance

Aplique nesta ordem.

### 6.1 HTTP magro

O request **valida, persiste o mínimo e devolve**. Trabalho lento ou com retry vai para **fila + worker**.

Ganho: a API escala por conexão; workers escalam 0→N; falha no job não derruba o HTTP.

### 6.2 Docker por workspace

- Stage de manifests (só `package.json`) para cachear `npm ci`
- `npm ci --omit=dev --workspace=@levity/api` — a API não leva SDKs só do worker
- User `node`, `NODE_ENV=production`

### 6.3 Banco

| Sintoma | Correção |
|---|---|
| Insert em loop | `INSERT … ON CONFLICT` (upsert em batch) |
| Lista cresce sem limite | `page` / `limit` + `PaginatedResponse` |
| JOIN + GROUP BY pesado | `LIMIT` + count separado (ou `loadRelationCountAndMap`) |
| Pool errado | `poolSize` por `RUNTIME_ROLE` |
| Filtro sem índice | migration **antes** do volume crescer |

### 6.4 Auth e fan-out

- Cache do usuário autenticado no Redis (TTL curto; invalidar no logout)
- `p-limit(k)` em fan-out (webhooks de saída, e-mails, chamadas a terceiros)
- Timeout + `maxRetries` baixo em cliente externo

### 6.5 Filas

- Retenção: completed ~100 / 24h; failed ~200 / 7d — Redis não é data warehouse
- Concurrency do worker explícita
- Payload pequeno: ids + o necessário. Arquivo grande não vai no job

### 6.6 Hot path

Paralelo o que é **independente**. Batch o que é o **mesmo tipo de I/O**. Não paralelize o que compete pelo mesmo lock ou pela mesma quota sem bound.

### 6.7 Observabilidade

- Log estruturado com `requestId` / `jobId` / `resourceId`
- Sem log por linha de loop
- `/health` raso (processo vivo). Checagem de DB/Redis só se o orquestrador exigir

---

## 7. Segurança da borda

- Helmet em produção (CSP ligado)
- CORS com allow-list, não `*`
- Rate-limit em produção
- Webhooks de entrada: HMAC em tempo constante; rejeitar sem assinatura
- JWT em cookie httpOnly **ou** `Authorization: Bearer` — um contrato só
- Segredos só em env / secret manager; nunca no git
- Registro público fechado ou allow-list, se o produto não for aberto

---

## 8. Checklist de projeto novo

1. `npm init` + workspaces `packages/*` `apps/*`, `"engines": { "node": ">=20" }`
2. `tsconfig.base.json` strict + raiz com `references`
3. Packages: `domain`, `config`, `observability`, `persistence`, `application`
4. App `api`: `main.ts`, `app.ts`, `composition-root.ts`, `modules/<recurso>/*.controller.ts`
5. TypeBox no env e no primeiro DTO; `validateDto` no controller
6. `AppError` + error handler; Pino; graceful shutdown
7. TypeORM + primeira migration; `synchronize: false`
8. Paginação no primeiro `GET` de lista
9. ESLint flat + CI `lint → build → test`
10. Use case lento ou com retry → **worker + fila**, não endpoint síncrono extra

Quando o segundo runtime nascer:

11. `RUNTIME_ROLE` no env
12. Port no `application` + producer em `queues`
13. Dockerfile multi-stage com deps **por workspace**
14. Pool e secrets **por papel**

---

## 9. Anti-padrões

| Anti-padrão | Faça isto |
|---|---|
| Service de 2k linhas | Quebre por agregado (`orders`, `customers`, …) |
| `persistence` importado no `domain` | DTO no domain; entity no persistence |
| `getRepository` no controller | Service + repo no composition root |
| `Promise.all` em N chamadas externas | `p-limit(k)` |
| `find()` sem `take` | `findAllPaginated` |
| `new Error('fail')` | `NotFoundError` / `ConflictError` / … |
| Jest + 3 configs para unit puro | `node:test` |
| Barrel interno que cria ciclo | `index.ts` só na borda do package |
| Worker e API no mesmo `node dist/main.js` | Dois `main.ts`, duas imagens |
| `synchronize: true` “só hoje” | Migration no dia 1 |
| Nest “para organizar” | O root já organiza; Nest adiciona peso |
