using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.Playwright;
using Microsoft.OpenApi.Models;
using HtmlToPdf.Application;
using HtmlToPdf.Application.Options;
using HtmlToPdf.Application.Enums;
using HtmlToPdf.Application.Extensions;
using HtmlToPdf.Application.BackgroundServices;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOptions<PdfPoolOptions>()
    .Bind(builder.Configuration.GetSection("PdfPool"))
    .ValidateDataAnnotations()
    .Validate(o => o.MinContexts <= o.MaxContexts, "MinContexts must be <= MaxContexts");

builder.Services.PostConfigure<PdfPoolOptions>(o =>
{
    o.ChromiumPath ??= Environment.GetEnvironmentVariable("CHROMIUM_PATH");
});

builder.Services.AddSingleton<PlaywrightHost>();
builder.Services.AddSingleton<BrowserPool>();
builder.Services.AddSingleton<ContextPoolManager>();

builder.Services.AddHostedService<ContextWarmupService>();
builder.Services.AddHostedService<BrowserRecycleService>();

builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = ctx =>
    {
        ctx.ProblemDetails.Extensions["traceId"] = ctx.HttpContext.TraceIdentifier;
    };
});

builder.Services.Configure<ApiDocumentationOptions>(builder.Configuration.GetSection("ApiDocumentationOptions"));

var apiDocOptions = builder.Configuration.GetSection("ApiDocumentationOptions").Get<ApiDocumentationOptions>()
    ?? new ApiDocumentationOptions();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = apiDocOptions.ApiName,
        Version = "v1",
        Description = apiDocOptions.ApiDescription,
        Contact = new OpenApiContact
        {
            Name = apiDocOptions.TeamName,
            Email = apiDocOptions.TeamEmail,
            Url = string.IsNullOrWhiteSpace(apiDocOptions.GithubUrl) ? null : new Uri(apiDocOptions.GithubUrl)
        }
    });
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseSwagger();
app.UseSwaggerUI();

var pdfs = app.MapGroup("/pdfs").WithTags("PDFs");

pdfs.MapPost("/", async (
    HttpRequest request,
    ContextPoolManager pool,
    IOptions<PdfPoolOptions> options,
    HttpResponse response,
    CancellationToken ct,
    [FromQuery] string? title,
    [FromQuery] PdfDisposition disposition = PdfDisposition.Inline,
    [FromQuery] PdfFormat format = PdfFormat.A4,
    [FromQuery] PdfOrientation orientation = PdfOrientation.Portrait,
    [FromQuery] bool printBackground = true,
    [FromQuery] double scale = 1.0) =>
{
    if (string.IsNullOrWhiteSpace(request.ContentType) ||
        !request.ContentType.StartsWith("text/html", StringComparison.OrdinalIgnoreCase))
    {
        return Results.BadRequest("Content-Type must be text/html.");
    }

    using var reader = new StreamReader(request.Body);
    var html = await reader.ReadToEndAsync(ct);

    if (string.IsNullOrWhiteSpace(html))
        return Results.BadRequest("HTML body is required.");

    if (scale < 0.1 || scale > 2.0)
        return Results.BadRequest("'scale' must be between 0.1 and 2.0.");

    await using var lease = await pool.AcquireAsync(ct);

    var ctx = lease.ContextWrapper.Context;
    var page = await ctx.NewPageAsync();

    try
    {
        await page.SetContentAsync(
            html,
            new PageSetContentOptions
            {
                WaitUntil = WaitUntilState.Load,
                Timeout = options.Value.PageLoadTimeoutMs
            });

        await page.WaitForFontsAsync();

        var pdfOptions = new PagePdfOptions
        {
            Format = format.ToString(),
            PrintBackground = printBackground,
            Scale = (float)scale,
            Landscape = orientation == PdfOrientation.Landscape
        };

        var pdfBytes = await page.PdfAsync(pdfOptions);

        var name = string.IsNullOrWhiteSpace(title)
            ? $"nvhtp-{Guid.NewGuid()}"
            : title!;

        return PdfResult(pdfBytes, response, name, disposition);
    }
    finally
    {
        await page.CloseAsync();
    }
})
.Accepts<string>("text/html")
.Produces(StatusCodes.Status200OK)
.Produces(StatusCodes.Status400BadRequest)
.Produces(StatusCodes.Status500InternalServerError)
.Produces(StatusCodes.Status504GatewayTimeout)
.WithSummary("Create a PDF from HTML")
.WithDescription("""
**Defaults:**

- **title**: auto-generated  
- **disposition**: `Inline`  
- **format**: `A4`  
- **orientation**: `Portrait`  
- **printBackground**: `true`  
- **scale**: `1.0` (must be between 0.1 and 2)
""");

pdfs.MapGet("/", async (
    [FromQuery(Name = "fromUrl")] string url,
    ContextPoolManager pool,
    IOptions<PdfPoolOptions> options,
    HttpResponse response,
    CancellationToken ct,
    [FromQuery] string? title,
    [FromQuery] PdfDisposition disposition = PdfDisposition.Inline,
    [FromQuery] PdfFormat format = PdfFormat.A4,
    [FromQuery] PdfOrientation orientation = PdfOrientation.Portrait,
    [FromQuery] bool printBackground = true,
    [FromQuery] double scale = 1.0) =>
{
    if (string.IsNullOrWhiteSpace(url))
        return Results.BadRequest("'fromUrl' is required.");

    if (!Uri.IsWellFormedUriString(url, UriKind.Absolute))
        return Results.BadRequest("Invalid URL.");

    if (scale < 0.1 || scale > 2)
        return Results.BadRequest("'scale' must be between 0.1 and 2.");

    await using var lease = await pool.AcquireAsync(ct);

    var ctx = lease.ContextWrapper.Context;
    var page = await ctx.NewPageAsync();

    try
    {
        await page.GotoAsync(
            url,
            new PageGotoOptions
            {
                WaitUntil = WaitUntilState.NetworkIdle,
                Timeout = options.Value.PageLoadTimeoutMs
            });

        await page.WaitForFontsAsync();

        var pdfOptions = new PagePdfOptions
        {
            Format = format.ToString(),
            PrintBackground = printBackground,
            Scale = (float)scale,
            Landscape = orientation == PdfOrientation.Landscape
        };

        var pdfBytes = await page.PdfAsync(pdfOptions);

        var name = string.IsNullOrWhiteSpace(title)
            ? $"nvhtp-{Guid.NewGuid()}"
            : title!;

        return PdfResult(pdfBytes, response, name, disposition);
    }
    finally
    {
        await page.CloseAsync();
    }
})
.Produces(StatusCodes.Status200OK)
.Produces(StatusCodes.Status400BadRequest)
.Produces(StatusCodes.Status500InternalServerError)
.Produces(StatusCodes.Status504GatewayTimeout)
.WithSummary("Create a PDF from URL")
.WithDescription("""
**Defaults:**

- **title**: auto-generated  
- **disposition**: `Inline`  
- **format**: `A4`  
- **orientation**: `Portrait`  
- **printBackground**: `true`  
- **scale**: `1.0` (must be between 0.1 and 2)
""");

app.Run();

static IResult PdfResult(
    byte[] pdfBytes,
    HttpResponse response,
    string fileName,
    PdfDisposition disposition)
{
    var cd = disposition == PdfDisposition.Attachment
        ? "attachment"
        : "inline";

    response.Headers.CacheControl = "no-store";
    response.Headers.Pragma = "no-cache";
    response.Headers.ContentDisposition =
        $"{cd}; filename=\"{fileName}.pdf\"";

    return Results.File(pdfBytes, "application/pdf");
}
