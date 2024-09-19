import { PDFOptions, Page } from "puppeteer";
import browserPool from "../services/browserPool";
import { configurePdfOptions } from "./pdfOptions";

export type PageContentHandler = (page: Page, content: string) => Promise<void>;

export async function generatePdf(
    content: string,
    options: any,
    pageContentHandler: PageContentHandler
): Promise<Buffer> {
    const page: Page = await browserPool.getPage();
    const pdfOptions: PDFOptions = await configurePdfOptions(options, page);

    try {
        await pageContentHandler(page, content);

        const pdfBuffer = await page.pdf(pdfOptions);

        return Buffer.from(pdfBuffer);
    } catch (error: any) {
        throw new Error('PDF generation failed: ' + error.message);
    } finally {
        await browserPool.releasePage(page);
    }
}
