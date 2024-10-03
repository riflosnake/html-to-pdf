import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { convertHtmlToPdf } from '../services/converters';
import { pdfRequestHandler } from '../helpers/pdfRequestHandler';

/**
 * @swagger
 * /convert/html:
 *   post:
 *     summary: Convert HTML to PDF
 *     description: Converts provided raw HTML content into a PDF document. The service accepts HTML input as `text/html` and returns a binary PDF file.
 *     requestBody:
 *       required: true
 *       content:
 *         text/html:
 *           schema:
 *             type: string
 *             description: The raw HTML content to be converted into a PDF.
 *           example: "<html><body><h1>Hello World</h1></body></html>"
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
 *         description: Bad Request - The request is invalid, possibly due to missing or incorrect HTML content.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "HTML content is missing or invalid."
 *       500:
 *         description: Internal Server Error - The server encountered an error while generating the PDF.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to generate PDF due to server error."
 */
async function convertHtmlToPdfHandler(req: Request, res: Response, next: NextFunction)
{
    await pdfRequestHandler(req, res, next, convertHtmlToPdf);
}

export const addHtmlToPdfEndpoint = (app: express.Express) => {
    app.use('/convert/html', express.text({ type: 'text/html', limit: '1mb' }))
    app.post('/convert/html', convertHtmlToPdfHandler);
  };
