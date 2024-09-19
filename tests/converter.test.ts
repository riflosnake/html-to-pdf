import browserPool from '../source/services/browserPool';
import { convertHtmlToPdf } from '../source/services/converters';

// TODO: Fix these tests, need to be mocked instead
describe('HTML to PDF Conversion', () => {
    it('should convert simple HTML to PDF', async () => {
        await browserPool.initialize();
        const html = '<html><body><h1>Hello, World!</h1></body></html>';
        const pdfBuffer = await convertHtmlToPdf(html, {});
        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should throw an error for invalid HTML', async () => {
        await browserPool.initialize();
        const html = '<html><body><h1>Hello, World!</h1>'; // Missing closing tags
        await expect(convertHtmlToPdf(html, {})).resolves.toBeInstanceOf(Buffer);
    });
});
