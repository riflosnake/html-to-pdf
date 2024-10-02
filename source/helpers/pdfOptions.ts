import { PDFOptions, Page } from "puppeteer";

export async function configurePdfOptions(options: any, page: Page) {
    if (options.customCSS) {
        await page.addStyleTag({ content: options.customCSS });
    }

    const pdfOptions: PDFOptions = {
        format: options.format || 'A4',
        landscape: options.landscape || false,
        margin: {
            top: options['margin-top'] || '0px',
            right: options['margin-right'] || '0px',
            bottom: options['margin-bottom'] || '0px',
            left: options['margin-left'] || '0px'
        },
        printBackground: options.printBackground || false,
        preferCSSPageSize: options.preferCSSPageSize || false,
        width: options.width,
        height: options.height,
        scale: options.scale || 1,
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        pageRanges: options.pageRanges
    };
    
    return pdfOptions;
}
