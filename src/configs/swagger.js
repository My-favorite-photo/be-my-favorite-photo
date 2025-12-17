import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyFavoritePhoto API Documentation',
      version: '1.0.0',
      description: '나의 최애의 포토 api 문서',
    },
    servers: [
      {
        url: 'https://be-my-favorite-photo.onrender.com',
        description: 'Render Production Server',
      },
      {
        url: 'http://localhost:3005',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, '../routes/*.js'), path.join(__dirname, '../swaggerDocs/**/*.yaml')],
};

export const specs = swaggerJSDoc(options);
