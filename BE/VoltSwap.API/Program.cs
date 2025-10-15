﻿using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Scalar.AspNetCore;
using VoltSwap.BusinessLayer.IServices;
using VoltSwap.BusinessLayer.Services;
using VoltSwap.DAL.Base;
using VoltSwap.DAL.Data;
using VoltSwap.DAL.UnitOfWork;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<VoltSwapDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", b =>
    {
        b.WithOrigins("http://localhost:5173",
            "https://localhost:5173"
            )
         .AllowAnyMethod()
         .AllowAnyHeader()
         .AllowCredentials();
    });
});
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<OverviewService>();
builder.Services.AddScoped<PlanService>();
builder.Services.AddScoped<StationService>();
builder.Services.AddScoped<BatterySwapService>();
builder.Services.AddScoped<TransactionService>();
builder.Services.AddScoped<IPlanService, PlanService>();
builder.Services.AddScoped(typeof(IGenericRepositories<>), typeof(GenericRepositories<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Warning);


var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
    app.MapScalarApiReference();
    app.MapOpenApi();
}


// Configure the HTTP request pipeline.

app.UseRouting();            // 1. Routing trước
app.UseCors("AllowFrontend"); // Apply CORS policy

// Disable HTTPS redirection in development to avoid 307 issues with Ngrok
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
} // 2. CORS trước UseHttpsRedirection
app.UseAuthorization();      // 4.
app.MapControllers();

app.Run();