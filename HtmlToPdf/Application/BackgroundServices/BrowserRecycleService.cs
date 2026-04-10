namespace HtmlToPdf.Application.BackgroundServices;

public sealed class BrowserRecycleService(BrowserPool browserPool, ContextPoolManager pool, ILogger<BrowserRecycleService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var snapshot = browserPool.Snapshot();

                var candidate = snapshot.FirstOrDefault(browserPool.NeedsRecycle);
                if (candidate is not null)
                {
                    logger.LogInformation("Recycling browser. Conversions={Conversions} ActiveLeases={ActiveLeases}",
                        candidate.Conversions, candidate.ActiveLeases);

                    await browserPool.ReplaceAsync(candidate, stoppingToken);

                    while (candidate.ActiveLeases > 0 && !stoppingToken.IsCancellationRequested)
                        await Task.Delay(250, stoppingToken);

                    // Remove any ready contexts that belong to the candidate to avoid
                    // dequeuing contexts that reference a browser about to be closed.
                    try
                    {
                        await pool.RemoveReadyContextsForBrowserAsync(candidate);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to purge ready contexts for recycled browser.");
                    }

                    await browserPool.RemoveAndCloseAsync(candidate);

                    logger.LogInformation("Browser recycled successfully.");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Browser recycle loop failure.");
            }

            await Task.Delay(1000, stoppingToken);
        }
    }
}
