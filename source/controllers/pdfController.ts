import { Request, Response, NextFunction } from 'express';
import { convertHtmlToPdf } from '../services/converter';
import express from 'express';

/**
 * @swagger
 * /convert:
 *   post:
 *     summary: Convert HTML to PDF
 *     description: Converts provided HTML content into a PDF document.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - html
 *             properties:
 *               html:
 *                 type: string
 *                 description: The HTML content to convert.
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
async function convertPdfHandler(req: Request, res: Response, next: NextFunction) {
    const { html } = req.body;

    if (!html) {
        return res.status(400).json({ error: 'HTML content is required' });
    }

    try {
        const pdfBuffer = await convertHtmlToPdf(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
        
        res.status(200).send(pdfBuffer);
    } catch (error) {
        next(error);
    }
}

export const addConvertEndpoint = (app: express.Express) => {
    app.post('/convert', convertPdfHandler);
  };
