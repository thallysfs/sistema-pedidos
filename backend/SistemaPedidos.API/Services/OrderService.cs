using Dapper;
using Microsoft.EntityFrameworkCore;
using SistemaPedidos.API.Data;
using SistemaPedidos.API.DTOs;
using SistemaPedidos.API.Models;

namespace SistemaPedidos.API.Services;

public class OrderService(AppDbContext context, IOrderEventPublisher eventPublisher)
{
    public async Task<PagedResponse<OrderResponse>> GetOrdersAsync(int page, int pageSize)
    {
        var totalCount = await context.Orders.CountAsync();

        var orders = await context.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        var data = orders.Select(MapToResponse);

        return new PagedResponse<OrderResponse>(
            Data: data,
            Page: page,
            PageSize: pageSize,
            TotalCount: totalCount,
            TotalPages: (int)Math.Ceiling(totalCount / (double)pageSize)
        );
    }

    public async Task<IEnumerable<BillingByDayResponse>> GetBillingByPeriodAsync(DateOnly from, DateOnly to)
    {
        var sql = """
            SELECT
                DATE("CreatedAt") AS "Date",
                SUM(oi."Quantity" * oi."UnitPrice") AS "TotalRevenue",
                COUNT(DISTINCT o."Id") AS "OrderCount"
            FROM "Orders" o
            INNER JOIN "OrderItems" oi ON oi."OrderId" = o."Id"
            WHERE DATE(o."CreatedAt") >= @From AND DATE(o."CreatedAt") <= @To
            GROUP BY DATE("CreatedAt")
            ORDER BY "Date"
            """;

        var conn = context.Database.GetDbConnection();
        var rows = await conn.QueryAsync<BillingRow>(sql, new
        {
            From = from.ToDateTime(TimeOnly.MinValue),
            To = to.ToDateTime(TimeOnly.MinValue)
        });

        return rows.Select(r => new BillingByDayResponse(
            Date: r.Date,
            TotalRevenue: r.TotalRevenue,
            OrderCount: (int)r.OrderCount
        ));
    }

    public async Task<OrderResponse> CreateOrderAsync(CreateOrderRequest request)
    {
        Validate(request);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerName = request.CustomerName.Trim(),
            CreatedAt = DateTime.UtcNow,
            Items = request.Items.Select(i => new OrderItem
            {
                Id = Guid.NewGuid(),
                ProductName = i.ProductName.Trim(),
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        };

        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var response = MapToResponse(order);

        try { await eventPublisher.PublishOrderCreatedAsync(response); }
        catch (Exception ex) { Console.Error.WriteLine($"[RabbitMQ] Falha ao publicar evento: {ex.Message}"); }

        return response;
    }

    public static decimal CalculateTotal(IEnumerable<OrderItem> items) =>
        items.Sum(i => i.Quantity * i.UnitPrice);

    public static void Validate(CreateOrderRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName))
            throw new ArgumentException("Nome do cliente é obrigatório.");

        var items = request.Items?.ToList() ?? [];

        if (items.Count == 0)
            throw new ArgumentException("O pedido deve conter pelo menos um item.");

        foreach (var item in items)
        {
            if (string.IsNullOrWhiteSpace(item.ProductName))
                throw new ArgumentException("Nome do produto é obrigatório.");

            if (item.Quantity <= 0)
                throw new ArgumentException($"Quantidade inválida para '{item.ProductName}'.");

            if (item.UnitPrice <= 0)
                throw new ArgumentException($"Preço inválido para '{item.ProductName}'.");
        }
    }

    private static OrderResponse MapToResponse(Order order)
    {
        var items = order.Items.Select(i => new OrderItemResponse(
            i.ProductName, i.Quantity, i.UnitPrice, i.Quantity * i.UnitPrice
        ));
        return new OrderResponse(
            order.Id, order.CustomerName, order.CreatedAt, items, CalculateTotal(order.Items)
        );
    }

    private record BillingRow(DateOnly Date, decimal TotalRevenue, long OrderCount);
}
