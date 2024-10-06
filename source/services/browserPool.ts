import puppeteer, { Browser, Page } from 'puppeteer';
import { Mutex } from 'async-mutex';
import config from '../config';
import logger from '../utils/logger';

class BrowserPool {
    private pool: { browser: Browser; pages: Set<Page> }[] = [];
    private minBrowsers: number;
    private maxBrowsers: number;
    private maxPagesPerBrowser: number;
    private puppeteerArgs: string[];
    private timeoutMs: number;
    private scaleUpThreshold = 0.8;
    private scaleDownThreshold = 0.4;
    private requestQueue: { resolve: (page: Page) => void;
                            reject: (err: Error) => void;
                            timeoutId: NodeJS.Timeout }[] = [];
    private getPageMutex: Mutex = new Mutex();
    private releasePageMutex: Mutex = new Mutex();

    constructor(minBrowsers: number, maxBrowsers: number, maxPagesPerBrowser: number, timeoutMs: number) {
        this.minBrowsers = minBrowsers;
        this.maxBrowsers = maxBrowsers;
        this.maxPagesPerBrowser = maxPagesPerBrowser;
        this.timeoutMs = timeoutMs;
        this.puppeteerArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process',
            '--no-zygote',
        ];
    }

    async initialize() {
        for (let i = 0; i < this.minBrowsers; i++) {
            await this.launchBrowser();
        }
    }

    private async launchBrowser() {
        if (this.pool.length >= this.maxBrowsers) {
            logger.warn('Max browsers reached.');
            return;
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: this.puppeteerArgs,
            executablePath: config.puppeteerExecutablePath,
        });

        this.pool.push({ browser, pages: new Set<Page>() });
        logger.info(`Initialized new browser instance. Total browsers active: ${this.pool.length}`);
    }

    private async closeBrowser() {
        const idleBrowserObj = this.pool.find(browserObj => browserObj.pages.size === 0);
    
        if (idleBrowserObj) {
            await idleBrowserObj.browser.close();
            this.pool = this.pool.filter(browserObj => browserObj !== idleBrowserObj);
            logger.info('Closed an idle browser instance.');
        } else {
            logger.warn('No idle browsers available to close.');
        }
    }

    private calculateOccupiedPages(): number {
        return this.pool.reduce((total, browserObj) => total + browserObj.pages.size, 0);
    }

    private calculateTotalCapacity(): number {
        return this.pool.length * this.maxPagesPerBrowser;
    }

    private shouldScaleUp(): boolean {
        const occupiedPages = this.calculateOccupiedPages();
        const totalCapacity = this.calculateTotalCapacity();
        return occupiedPages / totalCapacity >= this.scaleUpThreshold && this.pool.length < this.maxBrowsers;
    }

    private shouldScaleDown(): boolean {
        const occupiedPages = this.calculateOccupiedPages();
        const totalCapacity = this.calculateTotalCapacity();
        return this.pool.length > this.minBrowsers && occupiedPages / totalCapacity <= this.scaleDownThreshold;
    }

    private async scaleIfNeeded() {
        if (this.shouldScaleUp()) {
            logger.info(`Scaling up: ${config.capacityToScaleInPercentage}% capacity reached.`);
            await this.launchBrowser();
        } else if (this.shouldScaleDown()) {
            logger.info(`Scaling down: Usage below ${config.capacityToScaleInPercentage}% capacity.`);
            await this.closeBrowser();
        }
    }

    private async serveQueuedRequest(browserObj: { browser: Browser; pages: Set<Page> }) {
        if (this.requestQueue.length > 0) {
            const nextRequest = this.requestQueue.shift();
            if (nextRequest) {
                clearTimeout(nextRequest.timeoutId);
                this.scaleIfNeeded();
                const newPage = await browserObj.browser.newPage();
                browserObj.pages.add(newPage);
                nextRequest.resolve(newPage);
                logger.debug('Served a queued request.');
            }
        }
    }

    async getPage(): Promise<Page> {
        return this.getPageMutex.runExclusive(async () => {
            for (const browserObj of this.pool) {
                if (browserObj.pages.size < this.maxPagesPerBrowser) {
                    const page = await browserObj.browser.newPage();
                    browserObj.pages.add(page);
                    logger.debug(`New page opened. Total pages in browser #${this.pool.indexOf(browserObj)}: ${browserObj.pages.size}`);
                    await this.scaleIfNeeded();
                    return page;
                }
            }

            return this.queueRequest();
        });
    }

    async releasePage(page: Page) {
        await this.releasePageMutex.runExclusive(async () => {
            for (const browserObj of this.pool) {
                if (browserObj.pages.has(page)) {
                    await this.closePage(browserObj, page);
                    await this.serveQueuedRequest(browserObj);
                    await this.scaleIfNeeded();
                    break;
                }
            }
        });
    }

    private queueRequest(): Promise<Page> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Request timed out waiting for a free page.'));
            }, this.timeoutMs);

            this.requestQueue.push({ resolve, reject, timeoutId });
        });
    }

    private async closePage(browserObj: { browser: Browser; pages: Set<Page> }, page: Page) {
        try {
            await page.close();
            browserObj.pages.delete(page);
            logger.debug(`Page closed. Total pages in browser: ${browserObj.pages.size}`);
        } catch (error) {
            logger.error(`Error closing page: ${error}`);
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

const browserPool = new BrowserPool(config.minBrowsers,
                                    config.maxBrowsers,
                                    config.maxPagesPerBrowser,
                                    config.timeoutMs);

export default browserPool;
