using Microsoft.Extensions.Logging.Abstractions;
using SistemaPedidos.API.Models;
using SistemaPedidos.API.Services;

namespace SistemaPedidos.Tests.Integration;

public class OrderServiceIntegrationTests(PostgreSqlFixture fixture)
    : IClassFixture<PostgreSqlFixture>, IAsyncLifetime
{
    private API.Data.AppDbContext _context = null!;
    private OrderService _service = null!;

    public async Task InitializeAsync()
    {
        _context = fixture.CreateContext();
        _service = new OrderService(_context, new API.Services.NullOrderEventPublisher(), NullLogger<OrderService>.Instance);

        // Limpa entre testes para garantir isolamento
        _context.OrderItems.RemoveRange(_context.OrderItems);
        _context.Orders.RemoveRange(_context.Orders);
        await _context.SaveChangesAsync();
    }

    public async Task DisposeAsync() => await _context.DisposeAsync();

    // --- GetBillingByPeriodAsync ---

    [Fact]
    public async Task GetBillingByPeriod_ReturnsCorrectAggregationPerDay()
    {
        var jan1 = new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var jan2 = new DateTime(2025, 1, 2, 12, 0, 0, DateTimeKind.Utc);

        _context.Orders.AddRange(
            MakeOrder(jan1, ("Notebook", 1, 2000m), ("Mouse", 2, 100m)),  // total: 2200
            MakeOrder(jan1, ("Monitor", 1, 800m)),                         // total: 800
            MakeOrder(jan2, ("Teclado", 3, 150m))                          // total: 450
        );
        await _context.SaveChangesAsync();

        var result = (await _service.GetBillingByPeriodAsync(
            new DateOnly(2025, 1, 1),
            new DateOnly(2025, 1, 2)
        )).ToList();

        Assert.Equal(2, result.Count);

        var day1 = result.Single(r => r.Date == new DateOnly(2025, 1, 1));
        Assert.Equal(3000m, day1.TotalRevenue);
        Assert.Equal(2, day1.OrderCount);

        var day2 = result.Single(r => r.Date == new DateOnly(2025, 1, 2));
        Assert.Equal(450m, day2.TotalRevenue);
        Assert.Equal(1, day2.OrderCount);
    }

    [Fact]
    public async Task GetBillingByPeriod_ExcludesOrdersOutsideDateRange()
    {
        _context.Orders.AddRange(
            MakeOrder(new DateTime(2024, 12, 31, 12, 0, 0, DateTimeKind.Utc), ("Produto A", 1, 500m)),
            MakeOrder(new DateTime(2025, 1, 15, 12, 0, 0, DateTimeKind.Utc), ("Produto B", 1, 300m)),
            MakeOrder(new DateTime(2025, 2, 1, 12, 0, 0, DateTimeKind.Utc),  ("Produto C", 1, 200m))
        );
        await _context.SaveChangesAsync();

        var result = (await _service.GetBillingByPeriodAsync(
            new DateOnly(2025, 1, 1),
            new DateOnly(2025, 1, 31)
        )).ToList();

        Assert.Single(result);
        Assert.Equal(300m, result[0].TotalRevenue);
    }

    [Fact]
    public async Task GetBillingByPeriod_EmptyRange_ReturnsEmpty()
    {
        _context.Orders.Add(MakeOrder(
            new DateTime(2025, 6, 1, 12, 0, 0, DateTimeKind.Utc),
            ("Produto X", 1, 100m)
        ));
        await _context.SaveChangesAsync();

        var result = await _service.GetBillingByPeriodAsync(
            new DateOnly(2024, 1, 1),
            new DateOnly(2024, 1, 31)
        );

        Assert.Empty(result);
    }

    // --- GetOrdersAsync ---

    [Fact]
    public async Task GetOrders_ReturnsPaginatedResults()
    {
        var date = new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i < 15; i++)
            _context.Orders.Add(MakeOrder(date, ("Produto", 1, 100m)));
        await _context.SaveChangesAsync();

        var page1 = await _service.GetOrdersAsync(page: 1, pageSize: 10);
        var page2 = await _service.GetOrdersAsync(page: 2, pageSize: 10);

        Assert.Equal(15, page1.TotalCount);
        Assert.Equal(2, page1.TotalPages);
        Assert.Equal(10, page1.Data.Count());
        Assert.Equal(5, page2.Data.Count());
    }

    [Fact]
    public async Task GetOrders_TotalReflectsItemCalculation()
    {
        _context.Orders.Add(MakeOrder(
            new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc),
            ("Notebook", 2, 1500m),
            ("Mouse", 3, 80m)
        ));
        await _context.SaveChangesAsync();

        var result = await _service.GetOrdersAsync(1, 10);
        var order = result.Data.Single();

        Assert.Equal(3240m, order.Total); // 2*1500 + 3*80
    }

    // Helper para criar pedidos sem boilerplate nos testes
    private static Order MakeOrder(DateTime createdAt, params (string name, int qty, decimal price)[] items) =>
        new()
        {
            Id = Guid.NewGuid(),
            CustomerName = "Cliente Teste",
            CreatedAt = createdAt,
            Items = items.Select(i => new OrderItem
            {
                Id = Guid.NewGuid(),
                ProductName = i.name,
                Quantity = i.qty,
                UnitPrice = i.price
            }).ToList()
        };
}
