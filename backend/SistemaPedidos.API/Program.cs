using Microsoft.EntityFrameworkCore;
using SistemaPedidos.API.Data;
using SistemaPedidos.API.Services;

var builder = WebApplication.CreateBuilder(args);

using var startupLoggerFactory = LoggerFactory.Create(b => b.AddConsole());
var startupLogger = startupLoggerFactory.CreateLogger("Startup");

IOrderEventPublisher orderEventPublisher;
try
{
    orderEventPublisher = await RabbitMqPublisher.CreateAsync(builder.Configuration);
    startupLogger.LogInformation("[RabbitMQ] Conexão estabelecida com sucesso.");
}
catch (Exception ex)
{
    startupLogger.LogWarning(ex, "[RabbitMQ] Indisponível, eventos não serão publicados.");
    orderEventPublisher = new NullOrderEventPublisher();
}
builder.Services.AddSingleton<IOrderEventPublisher>(_ => orderEventPublisher);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<OrderService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DatabaseSeeder.SeedAsync(db);
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run();
