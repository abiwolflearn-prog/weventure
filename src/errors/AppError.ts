import { IApiErrorDetails } from '../types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: IApiErrorDetails[];

  constructor(message: string, statusCode: number, code: string, details?: IApiErrorDetails[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: IApiErrorDetails[]) {
    super(message, 422, 'VALIDATION_FAILED', details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: IApiErrorDetails[]) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Access token is missing, expired, or malformed') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'User does not possess required RBAC permissions or tenancy roles') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Specified resource, record, or tenant does not exist') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'API call rate limits crossed, please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}
