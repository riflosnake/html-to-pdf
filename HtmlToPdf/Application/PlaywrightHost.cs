using Microsoft.Playwright;

namespace HtmlToPdf.Application;

public sealed class PlaywrightHost : IDisposable
{
    public IPlaywright Playwright { get; }

    public PlaywrightHost()
    {
        Playwright = Microsoft.Playwright.Playwright
            .CreateAsync()
            .GetAwaiter()
            .GetResult();
    }

    public void Dispose()
    {
        Playwright.Dispose();
    }
}
