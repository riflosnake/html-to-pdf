import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { convertUrlHtmlToPdf } from '../services/converters';
import { pdfRequestHandler } from '../helpers/pdfRequestHandler';

/**
 * @swagger
 * /convert/url:
 *   post:
 *     summary: Convert URL to PDF
 *     description: Converts HTML from provided URL into a PDF document.
 *     requestBody:
 *       required: true
 *       content:
 *         text/html:
 *           schema:
 *             type: string
 *             description: The url, content of which will be converted.
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
async function convertUrlToPdfHandler(req: Request, res: Response, next: NextFunction)
{
    await pdfRequestHandler(req, res, next, convertUrlHtmlToPdf);
}

export const addUrlToPdfEndpoint = (app: express.Express) => {
    app.use('/convert/url', express.text({ type: 'text/plain', limit: '100kb' }))
    app.post('/convert/url', convertUrlToPdfHandler);
  };
