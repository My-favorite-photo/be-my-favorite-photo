import express from 'express';
import notificationRepository from '../repositories/notificationRepository.js';

const notificationRouter = express.Router();

notificationRouter.get('/', async (req, res, next) => {
  try {
    const { userId, limit } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId 필요' });

    const take = Number(limit) || 5;

    const notifications = await notificationRepository.findLatestByUser(userId, take);

    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

export default notificationRouter;
