---
name: pedidos-domain
description: Domínio, entidades, regras de negócio e contratos de API do sistema de pedidos. Use esta skill sempre que trabalhar com Orders, OrderItems, faturamento, paginação, criação de pedidos, ou qualquer funcionalidade de negócio deste sistema — mesmo que o usuário não cite o nome da skill explicitamente.
---

# Domínio — Sistema de Pedidos

## Entidades

### Order
Representa um pedido realizado por um cliente.

| Campo | Tipo | Regras |
|---|---|---|
| `Id` | `Guid` | Gerado automaticamente |
| `CustomerName` | `string` | Obrigatório, não pode ser vazio ou whitespace |
| `CreatedAt` | `DateTime` (UTC) | Definido no momento da criação, nunca alterado |
| `Items` | `ICollection<OrderItem>` | Mínimo 1 item por pedido |

### OrderItem
Representa um produto dentro de um pedido.

| Campo | Tipo | Regras |
|---|---|---|
| `Id` | `Guid` | Gerado automaticamente |
| `OrderId` | `Guid` | FK para `Order` |
| `ProductName` | `string` | Obrigatório, não pode ser vazio ou whitespace |
| `Quantity` | `int` | Deve ser > 0 |
| `UnitPrice` | `decimal` (precisão 10,2) | Deve ser > 0 |

**Total do pedido** = `SUM(item.Quantity * item.UnitPrice)` para todos os itens. Calculado em memória — não é persistido no banco.

---

## Regras de Negócio

1. Um pedido deve ter **pelo menos um item**.
2. `CustomerName` é obrigatório.
3. `ProductName` de cada item é obrigatório.
4. `Quantity` de cada item deve ser maior que zero.
5. `UnitPrice` de cada item deve ser maior que zero.
6. `CreatedAt` é sempre definido em UTC no momento da criação e nunca é editável.
7. O total de um pedido é calculado — nunca armazenado.

Violações das regras 1–5 retornam `400 Bad Request` com mensagem descritiva.

---

## Funcionalidades

### 1. Listar Pedidos
Retorna pedidos paginados, com seus itens e o total de cada pedido.

```
GET /orders?page={page}&pageSize={pageSize}
```

- `page`: número da página (padrão: 1, mínimo: 1)
- `pageSize`: itens por página (padrão: 20, máximo: 100)
- Ordenação: `CreatedAt DESC` (mais recentes primeiro)
- Implementado com **EF Core** + `.Include()` + `.Skip().Take()`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "customerName": "Maria Silva",
      "createdAt": "2025-01-15T10:30:00Z",
      "items": [
        { "productName": "Notebook", "quantity": 1, "unitPrice": 2999.90, "total": 2999.90 }
      ],
      "total": 2999.90
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 5001,
  "totalPages": 251
}
```

---

### 2. Faturamento por Período
Retorna o faturamento agregado **por dia** dentro de um intervalo de datas.

```
GET /orders/billing?from={date}&to={date}
```

- `from` e `to`: formato `yyyy-MM-dd`
- `from` deve ser ≤ `to` (caso contrário: `400 Bad Request`)
- Implementado com **Dapper** — SQL explícito com `GROUP BY DATE("CreatedAt")`
- Dias sem pedidos não aparecem no resultado

**Response 200:**
```json
[
  { "date": "2025-01-01", "totalRevenue": 22083.70, "orderCount": 9 },
  { "date": "2025-01-02", "totalRevenue": 13504.08, "orderCount": 2 }
]
```

**Por que Dapper aqui:** query de agregação com JOIN + GROUP BY — SQL explícito é mais legível e com performance previsível do que o equivalente em LINQ/EF Core.

---

### 3. Criar Pedido
Cria um novo pedido com seus itens.

```
POST /orders
Content-Type: application/json
```

**Request body:**
```json
{
  "customerName": "João Santos",
  "items": [
    { "productName": "Monitor LG 24\"", "quantity": 1, "unitPrice": 899.90 },
    { "productName": "Cabo HDMI", "quantity": 2, "unitPrice": 45.00 }
  ]
}
```

**Response 201:** retorna o pedido criado com id, itens e total calculado.
**Response 400:** mensagem de erro descritiva em caso de violação de regra.

Implementado com **EF Core**.

---

### 4. Tela Web
Interface React que:
- Lista os pedidos com paginação (navegar entre páginas)
- Exibe itens e total de cada pedido
- Permite criar um novo pedido via formulário (nome do cliente + adição dinâmica de itens)

---

## Banco de Dados

- **PostgreSQL 16** via Docker, porta **5433** (dev)
- Índice em `Orders.CreatedAt` (suporta o filtro do billing e a ordenação da listagem)
- **5.000 pedidos** + ~17.500 itens de seed (dados distribuídos nos últimos 2 anos)

### Tabelas
```sql
Orders      (Id, CustomerName, CreatedAt)
OrderItems  (Id, OrderId, ProductName, Quantity, UnitPrice)
```

---

## Camada de Acesso a Dados

| Operação | Tecnologia | Motivo |
|---|---|---|
| Listar pedidos | EF Core | Relacionamentos mapeados, `.Include()` limpo |
| Criar pedido | EF Core | Change tracking, transação implícita |
| Faturamento | Dapper | Agregação com `GROUP BY`, SQL explícito mais legível |
| Migrations | EF Core | Controle de schema versionado |

---

## Localização no Código

| Conceito | Arquivo |
|---|---|
| Entidades | `backend/SistemaPedidos.API/Models/` |
| DTOs | `backend/SistemaPedidos.API/DTOs/OrderDtos.cs` |
| Regras de negócio | `backend/SistemaPedidos.API/Services/OrderService.cs` |
| Controller | `backend/SistemaPedidos.API/Controllers/OrdersController.cs` |
| DbContext | `backend/SistemaPedidos.API/Data/AppDbContext.cs` |
| Testes unitários | `tests/SistemaPedidos.Tests/Services/OrderServiceTests.cs` |
| Testes integração | `tests/SistemaPedidos.Tests/Integration/` |
