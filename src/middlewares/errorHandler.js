import { HttpException } from '../common/exceptions/httpException.js';
import { isDevelopment } from '../configs/config.js';

export const errorHandler = (error, req, res, next) => {
  if (error.name === 'UnauthorizedError')
    return res.status(401).json({
      success: false,
      message: error.message || '인증되지 않은 사용자입니다.',
    });

  if (error instanceof HttpException)
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

  // dev 모드 일시 조금더 상세한 에러코드를 감쌈(back-stack-trace)
  let result = {
    success: false,
    message: 'Internal Server Error',
  };

  if (isDevelopment) {
    result = { ...result, stack: error.stack, originalMessage: error.message };
  }

  return res.status(500).json(result);
};
