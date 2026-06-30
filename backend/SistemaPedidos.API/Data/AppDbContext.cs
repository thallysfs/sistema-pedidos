using Microsoft.EntityFrameworkCore;
using SistemaPedidos.API.Models;

namespace SistemaPedidos.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(e =>
        {
            e.HasKey(o => o.Id);
            e.Property(o => o.CustomerName).HasMaxLength(200).IsRequired();
            e.Property(o => o.CreatedAt).IsRequired();
            e.HasMany(o => o.Items)
             .WithOne(i => i.Order)
             .HasForeignKey(i => i.OrderId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(o => o.CreatedAt);
        });

        modelBuilder.Entity<OrderItem>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.ProductName).HasMaxLength(200).IsRequired();
            e.Property(i => i.UnitPrice).HasPrecision(10, 2).IsRequired();
            e.Property(i => i.Quantity).IsRequired();
        });
    }
}
