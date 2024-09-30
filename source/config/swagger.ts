import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import express from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HTML to PDF Conversion Service',
      version: '1.0.0',
      description: 'API documentation for the HTML to PDF Conversion Service',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./source/endpoints/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app: express.Express) => {
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;
