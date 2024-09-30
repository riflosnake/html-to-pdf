import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import express from 'express';
import { spawn } from 'child_process';

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

export const openSwaggerInBrowser = (url: string) => {
  const platform = process.platform;
  let command;

  if (platform === 'win32') {
      command = 'start';
  } else if (platform === 'darwin') {
      command = 'open';
  } else {
      command = 'xdg-open';
  }

  spawn(command, [url], { shell: true });
}

export default setupSwagger;
