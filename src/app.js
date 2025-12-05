import cookieParser from 'cookie-parser';
import express from 'express';
import morgan from 'morgan';

import { config, isDevelopment, isProduction } from './configs/config.js';
import { cors } from './middlewares/cors.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRouter from './routes/authRoute.js';

const app = express();

app.use(cors);
app.use(express.json());
app.use(cookieParser());

if (isDevelopment) {
  app.use(morgan('dev'));
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

app.use('/auth', authRouter);

//-------- router module ---------

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log('Server Running On: http://localhost:' + config.PORT);
});
