import express from 'express';

import eventRewardController from '../controllers/eventRewardController.js';

const eventRouter = express.Router();

eventRouter.post('/rewards/grant', eventRewardController.grantReward);

export default eventRouter;
