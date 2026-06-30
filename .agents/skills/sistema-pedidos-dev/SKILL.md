---
name: sistema-pedidos-dev
description: Workflow de desenvolvimento para o projeto Sistema de Pedidos (.NET 10 + React + PostgreSQL). Use esta skill sempre que o usuário pedir para implementar endpoints, criar models, escrever queries, alterar o banco de dados, criar componentes React, ou qualquer tarefa de desenvolvimento neste projeto. Inclui regras de guardrails obrigatórias sobre banco de dados e testes unitários.
---

# Sistema Pedidos — Workflow de Desenvolvimento

Este projeto é um sistema de pedidos construído com:
- **Backend**: .NET 10 Web API com Controllers
- **ORM**: EF Core (CRUD e migrations) + Dapper (queries de agregação/relatório)
- **Banco**: PostgreSQL 16 na porta 5433 (Docker)
- **Frontend**: React (Vite)
- **Testes**: xUnit

Raiz do projeto: `/home/lostboy/Programação/sistema-pedidos/`

---

## Regras Inegociáveis

### 1. Banco de Dados — Confirmação Obrigatória

Nunca execute operações que alterem o estado do banco de dados sem confirmação explícita do usuário. Isso inclui:

- `dotnet ef database update` (aplicar migrations)
- `dotnet ef migrations remove` (remover migrations)
- Scripts de seed (inserção de dados em massa)
- Qualquer `DROP`, `TRUNCATE`, `DELETE` sem `WHERE` cuidadoso
- Reset do volume Docker (`docker compose down -v`)

**O que fazer**: Apresente o comando que será executado, explique o efeito, e aguarde o usuário dizer "pode executar" ou equivalente antes de rodar.

**Por quê**: Uma migration aplicada errada ou um seed rodando duas vezes pode corromper o banco de desenvolvimento e custar tempo precioso num projeto com prazo curto.

### 2. Testes Unitários — xUnit obrigatório para regras de negócio

Toda feature que contenha regra de negócio deve ter testes unitários com xUnit.

Exemplos de regras de negócio que exigem teste:
- Cálculo do total do pedido (soma de `Quantity * UnitPrice` dos itens)
- Validação de pedido sem itens
- Validação de campos obrigatórios (nome do cliente, produto, preço)
- Lógica de filtro de faturamento por período

**O que fazer**: Ao implementar qualquer lógica de negócio, crie automaticamente o teste correspondente no projeto `SistemaPedidos.Tests`. Se o projeto de testes ainda não existir, proponha criá-lo antes de prosseguir.

**O que NÃO precisa de teste**: Controllers (são finos, só delegam), migrations, seed data, configuração de DI.

### 3. Gatilho de Dúvida — Pare e Pergunte

Se qualquer um destes cenários acontecer, **pare imediatamente** e pergunte antes de continuar:

- Falta algum parâmetro necessário (ex: usuário pede "criar endpoint" sem dizer qual)
- A solicitação é ambígua (ex: "atualiza o pedido" — atualiza o quê? itens? status?)
- A implementação vai além do escopo pedido (ex: pediram paginação simples, mas você viu uma forma mais "completa")
- Há duas abordagens razoáveis com trade-offs relevantes

**Não assuma. Pergunte.**

---

## Estrutura do Projeto

```
sistema-pedidos/
├── backend/
│   └── SistemaPedidos.API/
│       ├── Controllers/       # Um controller por recurso
│       ├── Models/            # Order, OrderItem
│       ├── DTOs/              # Request/Response shapes
│       ├── Data/              # AppDbContext
│       ├── Services/          # Lógica de negócio (testável)
│       └── Migrations/
├── frontend/                  # React + Vite
├── tests/
│   └── SistemaPedidos.Tests/  # xUnit — espelha estrutura de Services/
└── docker-compose.yml
```

---

## Decisões Arquiteturais

| Decisão | Escolha | Motivo |
|---|---|---|
| EF Core | CRUD de pedidos, migrations | Produtividade, tracking de mudanças, relacionamentos mapeados |
| Dapper | Endpoint de faturamento por período | Query de agregação com `GROUP BY` — performance previsível, SQL legível |
| CORS | `AllowAnyOrigin` em dev | Simplicidade para o desafio; em prod seria restrito |
| Paginação | `OFFSET/LIMIT` | Suficiente para o volume do desafio; cursor-based seria melhor com milhões de registros |

---

## Convenções de Código

- **Controllers**: finos — só recebem request, chamam service, retornam response
- **Services**: contêm toda a lógica de negócio — são a camada testável
- **DTOs**: prefixo `Request` para entrada, `Response` para saída (ex: `CreateOrderRequest`, `OrderResponse`)
- **Nomes em inglês** no código, português só em comentários e README
- Retornos de API: sempre usar `ActionResult<T>` nos controllers

---

## Comandos Frequentes

```bash
# Subir banco
docker compose up -d

# Aplicar migration (pedir confirmação antes!)
export PATH="$PATH:/home/lostboy/.dotnet/tools"
cd backend/SistemaPedidos.API && dotnet ef database update

# Rodar API
cd backend/SistemaPedidos.API && dotnet run

# Rodar testes
cd tests/SistemaPedidos.Tests && dotnet test
```
