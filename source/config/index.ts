require('dotenv').config()

interface Config {
    port: number;
    maxBrowsers: number;
    maxPagesPerBrowser: number;
    puppeteerExecutablePath?: string;
    timeoutMs: number;
}

const config: Config = {
    port: parseInt(process.env.PORT || '3000', 10),
    maxBrowsers: parseInt(process.env.MAX_BROWSERS || '5', 10),
    maxPagesPerBrowser: parseInt(process.env.MAX_PAGES_PER_BROWSER || '10', 10),
    puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    timeoutMs: parseInt(process.env.TIMEOUT_MS || '30000', 10),
};

export default config;
