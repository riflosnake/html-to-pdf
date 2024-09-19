import { Page } from 'puppeteer';
import { PageContentHandler, generatePdf } from '../helpers/pdfGenerator';

export async function convertHtmlToPdf(html: string, options: any): Promise<Buffer>
{
    return await generatePdf(html, options, fromHtml);
}

export async function convertUrlHtmlToPdf(url: string, options: any): Promise<Buffer>
{
    return await generatePdf(url, options, fromUrl);
}

const fromHtml: PageContentHandler = async (page: Page, html: string) => {
    await page.setContent(html, { waitUntil: 'networkidle0' });
};

const fromUrl: PageContentHandler = async (page: Page, url: string) => {
    await page.goto(url, { waitUntil: 'networkidle0' });
};
