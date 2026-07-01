using Microsoft.AspNetCore.Mvc;
using SistemaPedidos.API.DTOs;
using SistemaPedidos.API.Services;

namespace SistemaPedidos.API.Controllers;

[ApiController]
[Route("orders")]
public class OrdersController(OrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page < 1 || pageSize < 1 || pageSize > 100)
            return BadRequest("Parâmetros de paginação inválidos.");

        var result = await orderService.GetOrdersAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("billing")]
    public async Task<IActionResult> GetBilling([FromQuery] DateOnly from, [FromQuery] DateOnly to)
    {
        if (from == DateOnly.MinValue || to == DateOnly.MinValue)
            return BadRequest("Os parâmetros 'from' e 'to' são obrigatórios.");

        if (from > to)
            return BadRequest("A data inicial deve ser anterior à data final.");

        var result = await orderService.GetBillingByPeriodAsync(from, to);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        try
        {
            var result = await orderService.CreateOrderAsync(request);
            return Created($"/orders/{result.Id}", result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
