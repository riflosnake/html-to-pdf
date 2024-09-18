import express from 'express';

export const addHealthEndpoint = (app: express.Express) => {
    app.get('/health', async (req, res) => {
        res.status(200).json({ status: 'OK' });
    });
}
