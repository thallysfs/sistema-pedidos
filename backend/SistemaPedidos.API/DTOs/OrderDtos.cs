namespace SistemaPedidos.API.DTOs;

public record OrderItemResponse(
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal Total
);

public record OrderResponse(
    Guid Id,
    string CustomerName,
    DateTime CreatedAt,
    IEnumerable<OrderItemResponse> Items,
    decimal Total
);

public record PagedResponse<T>(
    IEnumerable<T> Data,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

public record BillingByDayResponse(
    DateOnly Date,
    decimal TotalRevenue,
    int OrderCount
);

public record CreateOrderItemRequest(
    string ProductName,
    int Quantity,
    decimal UnitPrice
);

public record CreateOrderRequest(
    string CustomerName,
    IEnumerable<CreateOrderItemRequest> Items
);
