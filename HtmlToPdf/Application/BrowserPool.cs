using HtmlToPdf.Application.Options;
using Microsoft.Extensions.Options;
using Microsoft.Playwright;

namespace HtmlToPdf.Application;

public sealed class BrowserPool(
    PlaywrightHost playwrightHost,
    IOptions<PdfPoolOptions> options,
    ILogger<BrowserPool> logger) : IAsyncDisposable
{
    private readonly PdfPoolOptions _opts = options.Value;
    private readonly List<BrowserInstance> _browsers = [];
    private readonly object _gate = new();
    private readonly SemaphoreSlim _startLock = new(1, 1);

    public IReadOnlyList<BrowserInstance> Snapshot()
    {
        lock (_gate) return _browsers.ToList();
    }

    public async Task EnsureStartedAsync(CancellationToken ct)
    {
        await _startLock.WaitAsync(ct);
        try
        {
            var desired = _opts.Browsers;

            while (true)
            {
                ct.ThrowIfCancellationRequested();

                int count;
                lock (_gate) count = _browsers.Count;

                if (count >= desired) return;

                var b = await StartBrowserAsync(ct);
                lock (_gate) _browsers.Add(b);
            }
        }
        finally
        {
            _startLock.Release();
        }
    }

    public BrowserInstance GetHealthyBrowserForNewContext()
    {
        lock (_gate)
        {
            var candidate = _browsers
                .Where(b => !b.Draining)
                .OrderBy(b => b.ActiveLeases)
                .ThenBy(b => b.Conversions)
                .FirstOrDefault();

            if (candidate is null)
                throw new InvalidOperationException("No healthy browser available (all draining or not started).");

            return candidate;
        }
    }

    public bool NeedsRecycle(BrowserInstance b)
    {
        if (b.Draining) return false;

        var age = DateTime.UtcNow - b.CreatedAtUtc;
        return b.Conversions >= _opts.RecycleAfterConversions
               || age > TimeSpan.FromMinutes(_opts.RecycleAfterMinutes);
    }

    public async Task<BrowserInstance> ReplaceAsync(BrowserInstance toDrain, CancellationToken ct)
    {
        toDrain.Draining = true;

        var replacement = await StartBrowserAsync(ct);

        lock (_gate)
        {
            _browsers.Add(replacement);
        }

        return replacement;
    }

    public async Task RemoveAndCloseAsync(BrowserInstance b)
    {
        lock (_gate)
        {
            _browsers.Remove(b);
        }

        try
        {
            await b.Browser.CloseAsync();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Browser close failed.");
        }
    }

    private async Task<BrowserInstance> StartBrowserAsync(CancellationToken ct)
    {
        var args = new[]
        {
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-crashpad",
            "--disable-features=Crashpad",
            "--crash-dumps-dir=/tmp",
            "--disable-gpu",
            "--disable-software-rasterizer",
            "--disable-features=UseDBus",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding"
        };

        var browser = await playwrightHost.Playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            ExecutablePath = _opts.ChromiumPath,
            Headless = true,
            Args = args
        });

        logger.LogInformation("Started Chromium browser. CreatedAtUtc={CreatedAtUtc}", DateTime.UtcNow);

        return new BrowserInstance(browser);
    }

    public async ValueTask DisposeAsync()
    {
        List<BrowserInstance> browsers;
        lock (_gate) browsers = _browsers.ToList();

        foreach (var b in browsers)
        {
            try { await b.Browser.CloseAsync(); } catch { /* ignore */ }
        }
    }
}
