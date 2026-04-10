using HtmlToPdf.Application.Options;
using Microsoft.Extensions.Options;
using Microsoft.Playwright;
using System.Collections.Concurrent;

namespace HtmlToPdf.Application;

public sealed class ContextPoolManager : IAsyncDisposable
{
    private readonly BrowserPool _browserPool;
    private readonly PdfPoolOptions _opts;
    private readonly ILogger<ContextPoolManager> _logger;

    private readonly SemaphoreSlim _semaphore;
    private readonly ConcurrentQueue<ContextWrapper> _ready = new();
    private readonly object _readyGate = new();

    private int _warmupInFlight;

    public ContextPoolManager(
        BrowserPool browserPool,
        IOptions<PdfPoolOptions> options,
        ILogger<ContextPoolManager> logger)
    {
        _browserPool = browserPool;
        _opts = options.Value;
        _logger = logger;

        _semaphore = new SemaphoreSlim(_opts.MaxContexts, _opts.MaxContexts);
    }

    public int ReadyCount => _ready.Count;

    public async Task EnsureMinimumReadyAsync(CancellationToken ct)
    {
        await _browserPool.EnsureStartedAsync(ct);

        var deficit = _opts.MinContexts - _ready.Count;
        if (deficit <= 0) return;

        if (Interlocked.Exchange(ref _warmupInFlight, 1) == 1) return;

        try
        {
            while (_ready.Count < _opts.MinContexts && !ct.IsCancellationRequested)
            {
                if (!await _semaphore.WaitAsync(0, ct))
                    return;

                try
                {
                    var ctx = await CreateContextAsync(ct);
                    lock (_readyGate) _ready.Enqueue(ctx);
                }
                catch
                {
                    _semaphore.Release();
                    throw;
                }
            }
        }
        finally
        {
            Interlocked.Exchange(ref _warmupInFlight, 0);
        }
    }

    public async Task<Lease> AcquireAsync(CancellationToken ct)
    {
        // First prefer an already-ready context from the queue. Warmup reserves
        // semaphore slots for pre-created contexts, so dequeuing does NOT need
        // to wait on the semaphore (that would double-count the slot).
        List<ContextWrapper>? removed = null;
        ContextWrapper? valid = null;

        lock (_readyGate)
        {
            while (_ready.TryDequeue(out var existing))
            {
                if (existing.BrowserInstance.Draining)
                {
                    (removed ??= new()).Add(existing);
                    continue;
                }

                valid = existing;
                break;
            }
        }

        if (removed is not null)
        {
            foreach (var r in removed)
            {
                try { r.DisposeAsync().AsTask().GetAwaiter().GetResult(); } catch { }
                _semaphore.Release();
            }
        }

        if (valid is not null)
        {
            valid.BrowserInstance.LeaseStarted();
            return new Lease(this, valid);
        }

        // No ready context available — attempt to acquire a semaphore slot
        // (bounded by MaxContexts) and create a context on-demand.
        var timeout = TimeSpan.FromSeconds(_opts.AcquireTimeoutSeconds);

        if (!await _semaphore.WaitAsync(timeout, ct))
            throw new TimeoutException("PDF capacity exhausted (context slots).");

        ContextWrapper ctx;
        try
        {
            await _browserPool.EnsureStartedAsync(ct);
            ctx = await CreateContextAsync(ct);
        }
        catch
        {
            // If creation failed, release the reserved slot.
            _semaphore.Release();
            throw;
        }

        ctx.BrowserInstance.LeaseStarted();
        return new Lease(this, ctx);
    }

    private async Task<ContextWrapper> CreateContextAsync(CancellationToken ct)
    {
        var browserInstance = _browserPool.GetHealthyBrowserForNewContext();

        var context = await browserInstance.Browser.NewContextAsync(new BrowserNewContextOptions
        {
            IgnoreHTTPSErrors = true
        });

        return new ContextWrapper(browserInstance, context);
    }

    private async Task ReturnOrDiscardAsync(ContextWrapper ctx)
    {
        // Always close context to avoid state bleed between requests.
        // If you want reuse, you must add strict cleanup; this service chooses safety.
        try
        {
            ctx.BrowserInstance.IncrementConversions();
            await ctx.DisposeAsync();
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Context dispose failed.");
        }

        ctx.BrowserInstance.LeaseEnded();
        _semaphore.Release();
    }

    public readonly struct Lease(ContextPoolManager pool, ContextWrapper contextWrapper) : IAsyncDisposable
    {
        public ContextWrapper ContextWrapper { get; } = contextWrapper;

        public ValueTask DisposeAsync()
        {
            return new ValueTask(pool.ReturnOrDiscardAsync(ContextWrapper));
        }
    }

    public ValueTask DisposeAsync()
    {
        while (_ready.TryDequeue(out var ctx))
        {
            try { ctx.DisposeAsync().AsTask().GetAwaiter().GetResult(); } catch { /* ignore */ }
        }

        _semaphore.Dispose();
        return ValueTask.CompletedTask;
    }

    /// <summary>
    /// Remove and dispose any ready contexts that belong to the specified browser instance.
    /// Returns how many contexts were removed. This releases the semaphore for each
    /// removed context because warmup had reserved capacity for them.
    /// </summary>
    public async Task<int> RemoveReadyContextsForBrowserAsync(BrowserInstance browser)
    {
        List<ContextWrapper> removed = [];
        List<ContextWrapper> survivors = [];

        lock (_readyGate)
        {
            while (_ready.TryDequeue(out var ctx))
            {
                if (ctx.BrowserInstance == browser)
                    removed.Add(ctx);
                else
                    survivors.Add(ctx);
            }

            foreach (var s in survivors)
                _ready.Enqueue(s);
        }

        foreach (var r in removed)
        {
            try { await r.DisposeAsync(); } catch { }
            _semaphore.Release();
        }

        return removed.Count;
    }
}