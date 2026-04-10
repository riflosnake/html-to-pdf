using Microsoft.Playwright;

namespace HtmlToPdf.Application;

public sealed class BrowserInstance(IBrowser browser)
{
    public IBrowser Browser { get; } = browser;
    public DateTime CreatedAtUtc { get; } = DateTime.UtcNow;

    private int _conversions;
    private int _activeLeases;
    private int _draining;

    public int Conversions => Volatile.Read(ref _conversions);
    public int ActiveLeases => Volatile.Read(ref _activeLeases);

    public bool Draining
    {
        get => Volatile.Read(ref _draining) == 1;
        set => Interlocked.Exchange(ref _draining, value ? 1 : 0);
    }

    public void IncrementConversions() => Interlocked.Increment(ref _conversions);

    public void LeaseStarted() => Interlocked.Increment(ref _activeLeases);
    public void LeaseEnded() => Interlocked.Decrement(ref _activeLeases);
}
