import crypto from 'crypto';

/**
 * SDD Unified Response Contract Helper (RFC 7807 / JSend)
 */
export const sendSuccess = (res, data = {}, message = 'Sukses', statusCode = 200, extraMeta = {}) => {
  const req = res.req;
  const requestId = req?.headers?.['x-request-id'] || 'req-' + crypto.randomUUID();
  
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      version: 'v1.0',
      ...extraMeta
    }
  });
};

export const sendCreated = (res, data = {}, message = 'Data berhasil dibuat', extraMeta = {}) => {
  return sendSuccess(res, data, message, 201, extraMeta);
};

export const sendPaginated = (res, items = [], totalItems = 0, page = 1, limit = 10, message = 'Data berhasil diambil') => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return sendSuccess(res, items, message, 200, {
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: Number(totalItems),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
};
