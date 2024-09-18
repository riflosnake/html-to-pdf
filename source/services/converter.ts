import { Page } from 'puppeteer';
import browserPool from './browserPool';

export async function convertHtmlToPdf(html: string): Promise<Buffer> {
    const page: Page = await browserPool.getPage();

    try {
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        return Buffer.from(pdfBuffer);
    } catch (error: any) {
        throw new Error('PDF generation failed: ' + error.message);
    } finally {
        await browserPool.releasePage(page);
    }
}
