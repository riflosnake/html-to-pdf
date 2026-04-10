namespace HtmlToPdf.Application.Options;

using System.ComponentModel.DataAnnotations;

public sealed record PdfPoolOptions
{
    [Range(1, 200)]
    public int MinContexts { get; init; } = 10;

    [Range(1, 200)]
    public int MaxContexts { get; init; } = 20;

    [Range(1, 10)]
    public int Browsers { get; init; } = 2;

    [Range(1, 10_000)]
    public int RecycleAfterConversions { get; init; } = 500;

    [Range(1, 24 * 60)]
    public int RecycleAfterMinutes { get; init; } = 30;

    [Range(1, 300)]
    public int AcquireTimeoutSeconds { get; init; } = 15;

    [Range(1_000, 300_000)]
    public int PageLoadTimeoutMs { get; init; } = 30_000;

    public string? ChromiumPath { get; set; }
}
