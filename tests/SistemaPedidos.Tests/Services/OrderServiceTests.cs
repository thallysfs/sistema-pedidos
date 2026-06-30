using SistemaPedidos.API.DTOs;
using SistemaPedidos.API.Models;
using SistemaPedidos.API.Services;

namespace SistemaPedidos.Tests.Services;

public class OrderServiceTests
{
    // --- CalculateTotal ---

    [Fact]
    public void CalculateTotal_SingleItem_ReturnsCorrectValue()
    {
        var items = new List<OrderItem>
        {
            new() { Quantity = 2, UnitPrice = 50.00m }
        };

        var total = OrderService.CalculateTotal(items);

        Assert.Equal(100.00m, total);
    }

    [Fact]
    public void CalculateTotal_MultipleItems_SumsAll()
    {
        var items = new List<OrderItem>
        {
            new() { Quantity = 1, UnitPrice = 100.00m },
            new() { Quantity = 3, UnitPrice = 25.50m },
            new() { Quantity = 2, UnitPrice = 10.00m }
        };

        var total = OrderService.CalculateTotal(items);

        Assert.Equal(196.50m, total);
    }

    [Fact]
    public void CalculateTotal_EmptyList_ReturnsZero()
    {
        var total = OrderService.CalculateTotal([]);

        Assert.Equal(0m, total);
    }

    // --- Validate ---

    [Fact]
    public void Validate_ValidRequest_DoesNotThrow()
    {
        var request = new CreateOrderRequest(
            CustomerName: "Maria Silva",
            Items: [new CreateOrderItemRequest("Notebook", 1, 2500.00m)]
        );

        var ex = Record.Exception(() => OrderService.Validate(request));

        Assert.Null(ex);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_EmptyCustomerName_ThrowsArgumentException(string? name)
    {
        var request = new CreateOrderRequest(
            CustomerName: name!,
            Items: [new CreateOrderItemRequest("Notebook", 1, 2500.00m)]
        );

        Assert.Throws<ArgumentException>(() => OrderService.Validate(request));
    }

    [Fact]
    public void Validate_NoItems_ThrowsArgumentException()
    {
        var request = new CreateOrderRequest(
            CustomerName: "Maria Silva",
            Items: []
        );

        var ex = Assert.Throws<ArgumentException>(() => OrderService.Validate(request));
        Assert.Contains("pelo menos um item", ex.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_InvalidQuantity_ThrowsArgumentException(int quantity)
    {
        var request = new CreateOrderRequest(
            CustomerName: "Maria Silva",
            Items: [new CreateOrderItemRequest("Notebook", quantity, 2500.00m)]
        );

        var ex = Assert.Throws<ArgumentException>(() => OrderService.Validate(request));
        Assert.Contains("Quantidade inválida", ex.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-0.01)]
    public void Validate_InvalidUnitPrice_ThrowsArgumentException(double price)
    {
        var request = new CreateOrderRequest(
            CustomerName: "Maria Silva",
            Items: [new CreateOrderItemRequest("Notebook", 1, (decimal)price)]
        );

        var ex = Assert.Throws<ArgumentException>(() => OrderService.Validate(request));
        Assert.Contains("Preço inválido", ex.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyProductName_ThrowsArgumentException(string productName)
    {
        var request = new CreateOrderRequest(
            CustomerName: "Maria Silva",
            Items: [new CreateOrderItemRequest(productName, 1, 100m)]
        );

        Assert.Throws<ArgumentException>(() => OrderService.Validate(request));
    }
}
