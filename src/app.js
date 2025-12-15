import cookieParser from 'cookie-parser';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';

import { config, isDevelopment, isProduction, isTest } from './configs/config.js';
import { specs } from './configs/swagger.js';
import { cors } from './middlewares/cors.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRouter from './routes/authRoute.js';
import eventRouter from './routes/eventRoute.js';
import photoCardRouter from './routes/photoCardRouter.js';
import purchaseRouter from './routes/purchaseRoute.js';
import saleRouter from './routes/saleRouter.js';
import sellMyPhotoRouter from './routes/sellMyPhotoRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors);
app.use(express.json());
app.use(cookieParser());

if (isDevelopment || isTest) {
  app.use(morgan('dev'));
  app.use('/swaggerDocs', express.static(path.join(__dirname, 'swaggerDocs')));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

if (isProduction) {
  app.use(morgan('combined'));
}

//-------- router module --------
app.get('/', (req, res) => {
  res.json({
    message: 'HELLO MY PHOTO',
    timeStamp: new Date().toISOString(),
  });
});

app.use('/uploads', express.static('uploads'));
app.use('/auth', authRouter);
app.use('/cards', photoCardRouter);
app.use('/sells', sellMyPhotoRouter);
app.use('/sales', saleRouter);
app.use('/events', eventRouter);
app.use('/purchases', purchaseRouter);

//-------- router module ---------

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log('Server Running On: http://localhost:' + config.PORT);
});
