import express from 'express';

import auth from '../middlewares/auth.js';
import notificationRepository from '../repositories/notificationRepository.js';

const notificationRouter = express.Router();

notificationRouter.get('/', auth.verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit } = req.query;

    const take = Number(limit) || 5;

    const notifications = await notificationRepository.findLatestByUser(userId, take);

    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

notificationRouter.post('/read/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await notificationRepository.markAsRead(id);
    if (!notification) return res.status(404).json({ error: '알림을 찾을 수 없습니다.' });

    res.json(notification);
  } catch (err) {
    next(err);
  }
});

export default notificationRouter;
