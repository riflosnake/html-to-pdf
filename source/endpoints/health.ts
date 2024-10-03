import express from 'express';
import os from 'os';

export const addHealthEndpoint = (app: express.Express) => {
    app.get('/health', async (req, res) => {
        const memoryUsage = process.memoryUsage();
        const cpuLoad = os.loadavg();

        res.status(200).json({
            status: 'OK',
            uptime: process.uptime(),                          
            timestamp: new Date().toISOString(),
            version: process.env.APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            memoryUsage: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`, // Resident Set Size
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`, // Memory used by C++ objects bound to JS objects
            },
            cpuLoad: {
                '1min': cpuLoad[0],
                '5min': cpuLoad[1],
                '15min': cpuLoad[2]
            }
        });
    });
};
