import express from 'express';
import bodyParser from 'body-parser';
import config from './config';
import browserPool from './services/browserPool';
import { addConvertEndpoint } from './controllers/pdfController';
import { addHealthEndpoint } from './controllers/healthController';
import { errorHandler } from './middlewares/errorHandler';
import logger from './utils/logger';
import helmet from 'helmet';
import setupSwagger from './config/swagger';

const app = express();

app.use(bodyParser.json({ limit: '1mb' }));

app.use(helmet());

addConvertEndpoint(app);
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
