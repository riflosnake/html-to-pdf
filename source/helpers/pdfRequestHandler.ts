import { Request, Response, NextFunction } from 'express';

type ContentHandler = (content: string, options: any) => Promise<Buffer>;

export async function pdfRequestHandler(
    req: Request,
    res: Response,
    next: NextFunction,
    contentHandler: ContentHandler
) {
    const content = req.body;
    const options = req.query;

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        const pdfBuffer = await contentHandler(content, options);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
        
        res.status(200).send(pdfBuffer);
    } catch (error) {
        next(error);
    }
}
