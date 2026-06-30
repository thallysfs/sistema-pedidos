# Sistema de Pedidos — Agilean

Aplicação full stack para gestão de pedidos, faturamento e criação de novos pedidos.

| Camada    | Tecnologia              |
|-----------|-------------------------|
| Backend   | .NET 10 Web API         |
| ORM       | EF Core + Dapper        |
| Banco     | PostgreSQL 16 (Docker)  |
| Frontend  | React 19 + Vite + Tailwind CSS 4 |
| Testes    | xUnit                   |

---

## Pré-requisitos

Instale antes de começar:

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 20+ (LTS recomendado)
- Ferramenta EF Core (para migrations):

```bash
dotnet tool install --global dotnet-ef
```

---

## Colocando no ar (desenvolvimento)

Abra **três terminais** na raiz do projeto (`sistema-pedidos/`).

### 1. Banco de dados

```bash
docker compose up -d
```

O PostgreSQL sobe na porta **5433** com:

| Campo    | Valor              |
|----------|--------------------|
| Database | `sistema_pedidos`  |
| Usuário  | `postgres`         |
| Senha    | `postgres`         |

Verifique se o container está rodando:

```bash
docker compose ps
```

### 2. Backend (API)

```bash
cd backend/SistemaPedidos.API

# Cria as tabelas no banco (necessário na primeira execução)
dotnet ef database update

# Sobe a API na porta 5133 (mesma porta usada pelo proxy do frontend)
ASPNETCORE_URLS=http://localhost:5133 dotnet run
```

Na primeira execução, a API popula o banco com **5.000 pedidos** de exemplo automaticamente.

Endpoints principais:

| Método | Rota                    | Descrição                    |
|--------|-------------------------|------------------------------|
| GET    | `/orders?page=&pageSize=` | Listar pedidos paginados   |
| POST   | `/orders`               | Criar pedido                 |
| GET    | `/orders/billing?from=&to=` | Faturamento por período |

Teste rápido:

```bash
curl "http://localhost:5133/orders?page=1&pageSize=5"
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173/**

O Vite faz proxy das chamadas `/orders` para `http://localhost:5133` — por isso a API precisa estar rodando nessa porta.

---

## Ordem de subida (resumo)

```
1. docker compose up -d
2. dotnet ef database update  →  dotnet run  (porta 5133)
3. npm install  →  npm run dev  (porta 5173)
```

---

## Testes

```bash
cd tests/SistemaPedidos.Tests
dotnet test
```

---

## Build de produção (frontend)

```bash
cd frontend
npm run build
```

Os arquivos estáticos ficam em `frontend/dist/`. Sirva com Nginx, Caddy ou outro servidor de arquivos estáticos.

Para testar o build localmente:

```bash
npm run preview
```

> Em produção, configure o servidor web para encaminhar `/orders` para a API, ou ajuste a `baseURL` em `frontend/src/api/orders.ts`.

---

## Estrutura do projeto

```
sistema-pedidos/
├── backend/SistemaPedidos.API/   # API .NET
├── frontend/                     # React + Vite
├── tests/SistemaPedidos.Tests/   # Testes xUnit
├── docker-compose.yml            # PostgreSQL
└── requests.http                 # Exemplos de requisições HTTP
```

---

## Problemas comuns

### `ECONNREFUSED` na porta 5133

A API não está rodando. Suba o backend antes do frontend.

### Frontend sem dados / erro 502

O proxy do Vite não consegue falar com a API. Confirme:

```bash
curl http://localhost:5133/orders?page=1&pageSize=1
```

### `dotnet ef` não encontrado

```bash
dotnet tool install --global dotnet-ef
export PATH="$PATH:$HOME/.dotnet/tools"
```

### Porta 5173 já em uso

Outro processo Vite pode estar ocupando a porta. Encerre instâncias antigas:

```bash
pkill -f "node.*vite"
cd frontend && npm run dev
```

### `ENOENT: uv_cwd` ao rodar `npm`

O terminal perdeu referência ao diretório. Abra um terminal novo e entre novamente em `frontend/`:

```bash
cd "/caminho/para/sistema-pedidos/frontend"
npm run dev
```

### Erro de conexão com o banco

Confirme que o Docker está ativo e o Postgres responde na porta **5433**:

```bash
docker compose up -d
docker compose logs postgres
```

A connection string padrão está em `backend/SistemaPedidos.API/appsettings.json`.

---

## Parar o sistema

```bash
# Parar API e frontend: Ctrl+C nos terminais

# Parar o banco (mantém os dados)
docker compose down

# Parar o banco e apagar os dados
docker compose down -v
```
