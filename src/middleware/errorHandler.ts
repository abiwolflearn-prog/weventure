import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { IApiErrorResponse } from '../types';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const traceId = req.headers['x-request-id'] as string || `tr-${Math.random().toString(36).substr(2, 9)}`;
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected server error occurred';
  let details = err.details || undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Standard Mongoose ValidationError mapping
    statusCode = 422;
    code = 'VALIDATION_FAILED';
    message = 'Data persistence validation failed';
    if (err.errors) {
      details = Object.keys(err.errors).map((key) => ({
        field: key,
        issue: err.errors[key].message,
      }));
    }
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = `Invalid format for field '${err.path}'`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication signature is invalid';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication token has expired';
  }

  // Log the complete error detail based on status severity
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.path} failed with code ${code}`, err, {
      traceId,
      statusCode,
      path: req.path,
      query: req.query,
      user: req.user ? req.user.id : 'anonymous',
    });
  } else {
    logger.warn(`${req.method} ${req.path} failed with code ${code}`, {
      traceId,
      statusCode,
      path: req.path,
      query: req.query,
      user: req.user ? req.user.id : 'anonymous',
      errorMessage: err.message || String(err),
    });
  }

  const responseBody: IApiErrorResponse = {
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      code,
      message,
      details,
    },
    metadata: {
      traceId,
    },
  };

  // Add stack trace in development only for unhandled system errors
  if (env.NODE_ENV === 'development' && statusCode === 500) {
    responseBody.metadata = {
      ...responseBody.metadata,
      stack: err.stack,
    };
  }

  res.status(statusCode).json(responseBody);
};
