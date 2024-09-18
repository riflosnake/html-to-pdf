import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ErrorWithStatus extends Error {
    status?: number;
}

export function errorHandler(err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) {
    const status = err.status || 500;
    logger.error(`Error: ${err.message}`, { stack: err.stack });
    res.status(status).json({ error: err.message });
}
