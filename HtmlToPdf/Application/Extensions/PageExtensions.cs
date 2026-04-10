using Microsoft.Playwright;

namespace HtmlToPdf.Application.Extensions;

public static class PageExtensions
{
    public static async Task WaitForFontsAsync(this IPage page)
    {
        await page.EvaluateAsync("document.fonts.ready");
    }
}
