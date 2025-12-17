import randomPointService from '../services/randomPointService.js';

export const checkEligibility = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await randomPointService.checkRandomEligibility(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const executeRandom = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await randomPointService.execute(userId);
    res.json(result);
  } catch (err) {
    if (err.message === 'Cooldown not finished') {
      return res.status(429).json({
        message: err.message,
        nextAvailableAt: err.nextAvailableAt,
      });
    }
    next(err);
  }
};
