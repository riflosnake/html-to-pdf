import express from 'express';
import config from './config';
import browserPool from './services/browserPool';
import logger from './utils/logger';
import helmet from 'helmet';
import setupSwagger from './config/swagger';
import { addHtmlToPdfEndpoint } from './endpoints/htmlToPdf';
import { addHealthEndpoint } from './endpoints/health';
import { errorHandler } from './middlewares/errorHandler';
import { addUrlToPdfEndpoint } from './endpoints/urlToPdf';

const app = express();

app.use(helmet());

addHtmlToPdfEndpoint(app);
addUrlToPdfEndpoint(app);

addHealthEndpoint(app);

app.use(errorHandler);

setupSwagger(app);

async function startServer() {
    try {
        await browserPool.initialize();
        app.listen(config.port, () => {
            logger.info(`Server listening at http://localhost:${config.port}`);
            logger.info(`Swagger available at http://localhost:${config.port}/swagger`);
        });
    } catch (error) {
        logger.error('Failed to initialize browser pool', error);
        process.exit(1);
    }
}

startServer();

// Graceful Shutdown
process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing server');
    await browserPool.closeAllBrowsers();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing server');
    await browserPool.closeAllBrowsers();
    process.exit(0);
});
