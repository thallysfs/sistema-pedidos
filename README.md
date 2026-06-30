# Sistema de Pedidos — Agilean

Aplicação full stack para gestão de pedidos, faturamento e criação de novos pedidos, com microserviço de logística integrado via RabbitMQ.

| Camada              | Tecnologia                        |
|---------------------|-----------------------------------|
| Backend             | .NET 10 Web API                   |
| ORM                 | EF Core + Dapper                  |
| Banco               | PostgreSQL 16                     |
| Frontend            | React 19 + Vite + Tailwind CSS 4  |
| Microserviço        | Node.js 20                        |
| Mensageria          | RabbitMQ 3.13                     |
| Testes              | xUnit                             |

---

## Arquitetura

```
Frontend → POST /orders → Backend .NET → RabbitMQ → Microserviço de Logística
                               ↓
                          PostgreSQL
```

Quando um pedido é criado, o backend publica um evento na fila `orders.created` do RabbitMQ. O microserviço de logística consome esse evento e exibe o pedido como entrada na fila de separação.

---

## Subindo tudo com Docker (recomendado)

Com um único comando você sobe o banco, RabbitMQ, backend e microserviço de logística:

```bash
docker compose up --build
```

Serviços que sobem:

| Serviço             | Porta local | Descrição                          |
|---------------------|-------------|------------------------------------|
| PostgreSQL          | 5433        | Banco de dados                     |
| RabbitMQ (AMQP)     | 5672        | Mensageria                         |
| RabbitMQ (UI)       | 15672       | Painel de administração            |
| Backend API         | 5133        | API REST .NET                      |
| Logistics Service   | —           | Microserviço Node.js (sem porta exposta) |

Depois suba o frontend separadamente (dev server):

```bash
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173/**

### Painel do RabbitMQ

Acesse **http://localhost:15672** com usuário `guest` e senha `guest` para monitorar filas e mensagens.

### Logs do microserviço de logística

```bash
docker compose logs logistics-service -f
```

Ao criar um pedido, o terminal exibe:

```
──────────────────────────────────────────────────────────
  [14:32:01] 🆕 NOVO PEDIDO #C849A543
  Cliente : João Silva
  Itens   : 2x Webcam HD, 1x Headset
  Total   : R$ 750,98
  Status  : Aguardando separação
──────────────────────────────────────────────────────────

  → Pedido #C849A543 movido para separação
```

---

## Colocando no ar (desenvolvimento sem Docker)

Útil para iterar mais rápido no backend sem rebuildar a imagem.

Abra **três terminais** na raiz do projeto.

**Pré-requisitos:**
- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 20+

```bash
dotnet tool install --global dotnet-ef
```

### 1. Infraestrutura (banco + RabbitMQ)

```bash
docker compose up -d postgres rabbitmq
```

### 2. Backend (API)

```bash
cd backend/SistemaPedidos.API
dotnet run
```

A API sobe na porta **5133**. Na primeira execução popula o banco com **5.000 pedidos** de exemplo.

Endpoints principais:

| Método | Rota                          | Descrição                    |
|--------|-------------------------------|------------------------------|
| GET    | `/orders?page=&pageSize=`     | Listar pedidos paginados     |
| POST   | `/orders`                     | Criar pedido                 |
| GET    | `/orders/billing?from=&to=`   | Faturamento por período      |

### 3. Microserviço de logística

```bash
cd microservice
npm install
npm start
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173/**

---

## Ordem de subida (resumo)

```
# Com Docker (tudo junto):
docker compose up --build
cd frontend && npm run dev

# Sem Docker (desenvolvimento):
docker compose up -d postgres rabbitmq
dotnet run          (backend/SistemaPedidos.API/)
npm start           (microservice/)
npm run dev         (frontend/)
```

---

## Testes

```bash
cd tests/SistemaPedidos.Tests
dotnet test
```

---

## Estrutura do projeto

```
sistema-pedidos/
├── backend/SistemaPedidos.API/   # API REST .NET 10
├── frontend/                     # React 19 + Vite
├── microservice/                 # Microserviço Node.js (logística)
│   ├── src/index.js              # Consumer RabbitMQ + painel terminal
│   └── Dockerfile
├── tests/SistemaPedidos.Tests/   # Testes xUnit
├── docker-compose.yml            # Toda a infraestrutura
└── requests.http                 # Exemplos de requisições HTTP
```

---

## Microserviço de logística — desenho da solução

**Problema:** ao criar um pedido, o setor de logística precisa ser notificado para iniciar a separação dos itens.

**Decisão:** comunicação assíncrona via RabbitMQ (exchange `orders`, tipo `direct`, fila `orders.created`).

**Fluxo:**
1. `POST /orders` salva o pedido no PostgreSQL
2. O backend publica um evento JSON na fila com os dados do pedido
3. O microserviço Node.js consome o evento e exibe o pedido no terminal como entrada na fila de separação
4. Após 5 segundos simula a movimentação para "em separação"

**Por que RabbitMQ e não HTTP síncrono?**
- O backend não precisa aguardar o microserviço responder — a criação do pedido não falha se a logística estiver fora
- O microserviço pode reiniciar e reprocessar mensagens pendentes (fila durável)
- Desacoplamento total: qualquer serviço pode consumir o mesmo evento no futuro

**Resiliência:** se o RabbitMQ estiver indisponível na inicialização do backend, um `NullPublisher` é usado como fallback — a API continua funcionando sem publicar eventos. O microserviço implementa retry automático com até 10 tentativas e reconexão automática em caso de queda.

---

## Parar o sistema

```bash
# Parar tudo (mantém os dados)
docker compose down

# Parar tudo e apagar os dados do banco
docker compose down -v
```

---

## Problemas comuns

### Backend não conecta ao RabbitMQ

Confirme que o RabbitMQ está saudável:

```bash
docker compose ps
docker compose logs rabbitmq
```

### `ECONNREFUSED` na porta 5133

A API não está rodando. Suba o backend antes do frontend.

### Frontend sem dados / erro 502

O proxy do Vite não consegue falar com a API. Confirme:

```bash
curl "http://localhost:5133/orders?page=1&pageSize=1"
```

### `dotnet ef` não encontrado

```bash
dotnet tool install --global dotnet-ef
export PATH="$PATH:$HOME/.dotnet/tools"
```

### Porta 5173 já em uso

```bash
pkill -f "node.*vite"
cd frontend && npm run dev
```

### Erro de conexão com o banco

```bash
docker compose up -d postgres
docker compose logs postgres
```
