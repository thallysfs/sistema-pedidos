using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using SistemaPedidos.API.DTOs;

namespace SistemaPedidos.API.Services;

public interface IOrderEventPublisher
{
    Task PublishOrderCreatedAsync(OrderResponse order);
}

public class NullOrderEventPublisher : IOrderEventPublisher
{
    public Task PublishOrderCreatedAsync(OrderResponse order) => Task.CompletedTask;
}

public class RabbitMqPublisher : IOrderEventPublisher, IAsyncDisposable
{
    private const string ExchangeName = "orders";
    private const string QueueName = "orders.created";
    private const string RoutingKey = "order.created";

    private readonly IConnection _connection;
    private readonly IChannel _channel;

    private RabbitMqPublisher(IConnection connection, IChannel channel)
    {
        _connection = connection;
        _channel = channel;
    }

    public static async Task<RabbitMqPublisher> CreateAsync(IConfiguration configuration)
    {
        var section = configuration.GetSection("RabbitMq");
        var factory = new ConnectionFactory
        {
            HostName = section["Host"] ?? "localhost",
            Port = int.Parse(section["Port"] ?? "5672"),
            UserName = section["User"] ?? "guest",
            Password = section["Password"] ?? "guest"
        };

        var connection = await factory.CreateConnectionAsync();
        var channel = await connection.CreateChannelAsync();

        await channel.ExchangeDeclareAsync(ExchangeName, ExchangeType.Direct, durable: true);
        await channel.QueueDeclareAsync(QueueName, durable: true, exclusive: false, autoDelete: false);
        await channel.QueueBindAsync(QueueName, ExchangeName, RoutingKey);

        return new RabbitMqPublisher(connection, channel);
    }

    public async Task PublishOrderCreatedAsync(OrderResponse order)
    {
        var json = JsonSerializer.Serialize(order, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var body = Encoding.UTF8.GetBytes(json);

        var props = new BasicProperties { Persistent = true };
        await _channel.BasicPublishAsync(ExchangeName, RoutingKey, false, props, body);
    }

    public async ValueTask DisposeAsync()
    {
        await _channel.DisposeAsync();
        await _connection.DisposeAsync();
    }
}
