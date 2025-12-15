import eventRewardService from '../services/eventRewardService.js';

async function grantReward(req, res, next) {
  try {
    const { userId, amount, type, description } = req.body;

    const result = await eventRewardService.grantReward({
      userId,
      amount,
      type,
      description,
    });

    res.status(200).json({
      message: '이벤트 보상 포인트 지급!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  grantReward,
};
