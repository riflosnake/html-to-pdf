import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { convertHtmlToPdf } from '../services/converters';
import { pdfRequestHandler } from '../helpers/pdfRequestHandler';

// TODO: Fix swagger documentation, currently it doesn't show any specs, as soon as i introduced
// another endpoint
/**
 * @swagger
 * /convert/html:
 *   post:
 *     summary: Convert HTML to PDF
 *     description: Converts provided raw HTML content into a PDF document.
 *     requestBody:
 *       required: true
 *       content:
 *         text/html:
 *           schema:
 *             type: string
 *             description: The raw HTML content to convert.
 *     responses:
 *       200:
 *         description: PDF generated successfully.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad Request - HTML content is missing or invalid.
 *       500:
 *         description: Internal Server Error - Failed to generate PDF.
 */
async function convertHtmlToPdfHandler(req: Request, res: Response, next: NextFunction)
{
    await pdfRequestHandler(req, res, next, convertHtmlToPdf);
}

export const addHtmlToPdfEndpoint = (app: express.Express) => {
    // TODO: Inserting HTML into a JSON requires formatting beforehand, need to rethink
    // thinking about providing three endpoints
    // One which will be like this, accept as body raw html, and options as query parameters
    // and other two, which will have json body type, one for html, one for url
    // and the options will be properties on the body json also, making it cleaner
    // app.use('/convert/html', express.json({ limit: '1mb' }));
    app.use('/convert/html', express.text({ type: 'text/html', limit: '1mb' }))
    app.post('/convert/html', convertHtmlToPdfHandler);
  };
