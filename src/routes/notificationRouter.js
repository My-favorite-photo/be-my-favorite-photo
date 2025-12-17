import express from 'express';
import notificationRepository from '../repositories/notificationRepository.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

 const notificationRouter = express.Router();

 notificationRouter.get('/', authMiddleware, async (req, res, next) => {
   try {;
    const userId = req.user.id;
    const { limit } = req.query;

    const take = Number(limit) || 5;

    const notifications = await notificationRepository.findLatestByUser(userId, take);

    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

export default notificationRouter;
