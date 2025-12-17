import express from 'express';

import { checkEligibility, executeRandom } from '../controllers/randomPointController.js';
import auth from '../middlewares/auth.js';

const randomPointRouter = express.Router();

randomPointRouter.get('/eligibility', auth.verifyAccessToken, checkEligibility);
randomPointRouter.post('/', auth.verifyAccessToken, executeRandom);

export default randomPointRouter;
