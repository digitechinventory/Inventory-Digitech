import crypto from 'crypto';

export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'VALIDATION_FAILED', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || (statusCode === 404 ? 'RESOURCE_NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'Terjadi kesalahan pada sistem server.';
  
  const responsePayload = {
    success: false,
    statusCode,
    error: {
      code: errorCode,
      message: message,
      ...(err.details && { details: err.details })
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'req-' + crypto.randomUUID(),
      path: req.originalUrl
    }
  };

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    responsePayload.error.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};
