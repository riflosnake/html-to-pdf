import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { convertUrlHtmlToPdf } from '../services/converters';
import { pdfRequestHandler } from '../helpers/pdfRequestHandler';

/**
 * @swagger
 * /convert/url:
 *   post:
 *     summary: Convert URL to PDF
 *     description: Converts HTML content from the provided URL into a PDF document. The service fetches the HTML content from the given URL and converts it into a PDF file.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: The URL of the webpage whose content will be converted into a PDF.
 *                 example: "https://example.com"
 *           example:
 *             url: "https://example.com"
 *     responses:
 *       200:
 *         description: PDF generated successfully.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           example: "(Binary PDF Data)"
 *       400:
 *         description: Bad Request - The URL is missing, invalid, or the content from the URL cannot be retrieved or converted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid URL or failed to retrieve content."
 *       500:
 *         description: Internal Server Error - The server encountered an error while generating the PDF from the URL.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to generate PDF due to server error."
 */
async function convertUrlToPdfHandler(req: Request, res: Response, next: NextFunction)
{
    await pdfRequestHandler(req, res, next, convertUrlHtmlToPdf);
}

export const addUrlToPdfEndpoint = (app: express.Express) => {
    app.use('/convert/url', express.text({ type: 'text/plain', limit: '100kb' }))
    app.post('/convert/url', convertUrlToPdfHandler);
  };
