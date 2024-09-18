import puppeteer, { Browser, Page } from 'puppeteer';
import config from '../config';
import logger from '../utils/logger';

class BrowserPool {
    private pool: { browser: Browser; pages: Set<Page> }[] = [];
    private maxBrowsers: number;
    private maxPagesPerBrowser: number;
    private puppeteerArgs: string[];

    constructor(maxBrowsers: number, maxPagesPerBrowser: number) {
        this.maxBrowsers = maxBrowsers;
        this.maxPagesPerBrowser = maxPagesPerBrowser;
        this.puppeteerArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process',
            '--no-zygote'
        ];
    }

    async initialize() {
        for (let i = 0; i < this.maxBrowsers; i++) {
            const browser = await puppeteer.launch({
                headless: true,
                args: this.puppeteerArgs,
                executablePath: config.puppeteerExecutablePath, // Optional: specify if needed
            });
            this.pool.push({ browser, pages: new Set<Page>() });
            logger.info(`Initialized browser instance ${i + 1}/${this.maxBrowsers}`);
        }
    }

    async getPage(): Promise<Page> {
        for (const browserObj of this.pool) {
            if (browserObj.pages.size < this.maxPagesPerBrowser) {
                const page = await browserObj.browser.newPage();
                browserObj.pages.add(page);
                logger.debug(`New page opened. Total pages in browser: ${browserObj.pages.size}`);
                return page;
            }
        }

        // Wait for a page to become available
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                for (const browserObj of this.pool) {
                    if (browserObj.pages.size < this.maxPagesPerBrowser) {
                        browserObj.browser.newPage().then((page) => {
                            browserObj.pages.add(page);
                            clearInterval(interval);
                            logger.debug(`New page opened after wait. Total pages in browser: ${browserObj.pages.size}`);
                            resolve(page);
                        }).catch(reject);
                        return;
                    }
                }
            }, 100); // Check every 100ms

            // Optional: Add timeout to prevent indefinite waiting
            setTimeout(() => {
                clearInterval(interval);
                reject(new Error('No available browser pages.'));
            }, config.timeoutMs);
        });
    }

    async releasePage(page: Page) {
        for (const browserObj of this.pool) {
            if (browserObj.pages.has(page)) {
                try {
                    await page.close();
                    browserObj.pages.delete(page);
                    logger.debug(`Page closed. Total pages in browser: ${browserObj.pages.size}`);
                } catch (error) {
                    logger.error(`Error closing page: ${error}`);
                }
                break;
            }
        }
    }

    async closeAllBrowsers() {
        for (const browserObj of this.pool) {
            await browserObj.browser.close();
            logger.info('Browser instance closed.');
        }
        this.pool = [];
    }
}

const browserPool = new BrowserPool(config.maxBrowsers, config.maxPagesPerBrowser);
export default browserPool;
