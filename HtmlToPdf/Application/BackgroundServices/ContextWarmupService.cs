namespace HtmlToPdf.Application.BackgroundServices;

public sealed class ContextWarmupService(ContextPoolManager pool, ILogger<ContextWarmupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await pool.EnsureMinimumReadyAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Warmup loop failure.");
            }

            await Task.Delay(500, stoppingToken);
        }
    }
}
