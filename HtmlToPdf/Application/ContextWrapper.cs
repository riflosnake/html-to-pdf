using Microsoft.Playwright;

namespace HtmlToPdf.Application;

public sealed class ContextWrapper(BrowserInstance browserInstance, IBrowserContext context) : IAsyncDisposable
{
    public BrowserInstance BrowserInstance { get; } = browserInstance;
    public IBrowserContext Context { get; } = context;

    public async ValueTask DisposeAsync()
    {
        try { await Context.CloseAsync(); }
        catch { /* ignore close errors */ }
    }
}
