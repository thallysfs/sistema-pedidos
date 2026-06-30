using Microsoft.EntityFrameworkCore;
using SistemaPedidos.API.Models;

namespace SistemaPedidos.API.Data;

public static class DatabaseSeeder
{
    private static readonly string[] CustomerNames =
    [
        "Maria Silva", "João Santos", "Ana Oliveira", "Pedro Costa", "Carla Souza",
        "Lucas Lima", "Fernanda Pereira", "Rafael Alves", "Juliana Rodrigues", "Bruno Martins",
        "Camila Ferreira", "Thiago Gomes", "Larissa Ribeiro", "Felipe Araujo", "Patrícia Nascimento",
        "Gustavo Carvalho", "Aline Mendes", "Rodrigo Barbosa", "Tatiane Cardoso", "Diego Pinto",
        "Vanessa Moreira", "Eduardo Rocha", "Priscila Castro", "Marcelo Correia", "Simone Teixeira"
    ];

    private static readonly (string Name, decimal MinPrice, decimal MaxPrice)[] Products =
    [
        ("Notebook Dell Inspiron 15", 2500m, 3500m),
        ("Monitor LG 24\"", 800m, 1200m),
        ("Teclado Mecânico Redragon", 180m, 350m),
        ("Mouse Logitech MX Master", 150m, 280m),
        ("Headset HyperX Cloud", 250m, 450m),
        ("SSD Samsung 1TB", 350m, 600m),
        ("Memória RAM 16GB DDR4", 250m, 450m),
        ("Webcam Logitech C920", 280m, 420m),
        ("Hub USB-C 7 portas", 80m, 180m),
        ("Cabo HDMI 2.1 2m", 30m, 80m),
        ("Suporte para Monitor", 90m, 200m),
        ("Mesa Digitalizadora XP-Pen", 350m, 700m),
        ("Roteador TP-Link AX3000", 400m, 650m),
        ("No-Break APC 700VA", 350m, 550m),
        ("Impressora HP LaserJet", 800m, 1400m),
        ("Cadeira Gamer ThunderX3", 900m, 1800m),
        ("Mesa de Escritório 1,4m", 400m, 800m),
        ("Luminária LED de Mesa", 60m, 150m),
        ("Filtro de Linha 5 tomadas", 45m, 90m),
        ("Pasta Térmica Arctic MX-4", 25m, 50m),
    ];

    public static async Task SeedAsync(AppDbContext context)
    {
        if (await context.Orders.AnyAsync())
            return;

        var random = new Random(42);
        var orders = new List<Order>();
        var startDate = DateTime.UtcNow.AddYears(-2);
        var totalDays = (DateTime.UtcNow - startDate).Days;

        for (int i = 0; i < 5000; i++)
        {
            var order = new Order
            {
                Id = Guid.NewGuid(),
                CustomerName = CustomerNames[random.Next(CustomerNames.Length)],
                CreatedAt = startDate.AddDays(random.Next(totalDays))
                                     .AddHours(random.Next(24))
                                     .AddMinutes(random.Next(60)),
                Items = []
            };

            var itemCount = random.Next(1, 7);
            var usedProducts = new HashSet<int>();

            for (int j = 0; j < itemCount; j++)
            {
                int productIndex;
                do { productIndex = random.Next(Products.Length); }
                while (!usedProducts.Add(productIndex));

                var (name, minPrice, maxPrice) = Products[productIndex];
                var unitPrice = Math.Round(minPrice + (decimal)random.NextDouble() * (maxPrice - minPrice), 2);

                order.Items.Add(new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    ProductName = name,
                    Quantity = random.Next(1, 4),
                    UnitPrice = unitPrice
                });
            }

            orders.Add(order);
        }

        // Insere em lotes para não sobrecarregar a memória
        const int batchSize = 500;
        for (int i = 0; i < orders.Count; i += batchSize)
        {
            var batch = orders.Skip(i).Take(batchSize);
            await context.Orders.AddRangeAsync(batch);
            await context.SaveChangesAsync();
        }
    }
}
