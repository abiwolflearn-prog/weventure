import { Response } from 'express';
import { IApiResponseSingle, IApiResponsePaginated, IPaginationMeta } from '../types';

export class ApiResponse {
  /**
   * Send a standard successful single resource response
   */
  public static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    metadata?: Record<string, any>
  ): Response {
    const payload: IApiResponseSingle<T> = {
      success: true,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        version: '1.0.0',
        ...metadata,
      },
    };
    return res.status(statusCode).json(payload);
  }

  /**
   * Send a standard paginated response
   */
  public static paginated<T>(
    res: Response,
    data: T[],
    pagination: IPaginationMeta,
    statusCode: number = 200,
    metadata?: Record<string, any>
  ): Response {
    const payload: IApiResponsePaginated<T> = {
      success: true,
      timestamp: new Date().toISOString(),
      data,
      pagination,
      metadata: {
        version: '1.0.0',
        ...metadata,
      },
    };
    return res.status(statusCode).json(payload);
  }
}
