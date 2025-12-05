import { isDevelopment } from '../configs/config.js';

export const cors = (req, res, next) => {
  const origin = req.headers.origin || req.headers.host || '';

  const whiteList = ['http://localhost:3000'];

  const isAllowed = isDevelopment || whiteList.includes(origin);
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.sendStatus(204); // NO CONTENT

  next();
};
