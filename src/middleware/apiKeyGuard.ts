import { Request, Response, NextFunction } from 'express';
import { integrationService } from '../services/IntegrationService';
import { UnauthorizedError } from '../errors/AppError';

export const apiKeyGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let apiKey: string | null = null;

    // 1. Extract from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.split(' ')[1];
      } else {
        apiKey = authHeader; // fallback to raw string
      }
    }

    // 2. Fallback to custom header
    if (!apiKey && req.headers['x-api-key']) {
      apiKey = req.headers['x-api-key'] as string;
    }

    if (!apiKey) {
      throw new UnauthorizedError('API credential token is missing (Authorization header or X-API-Key)');
    }

    // Get client IP for whitelisting checks
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const keyDoc = await integrationService.validateApiKey(apiKey, clientIp);

    // Bind authenticated API Key context to the request
    req.tenantId = keyDoc.tenantId.toLowerCase();
    (req as any).apiKeyContext = {
      id: keyDoc._id,
      name: keyDoc.name,
      environment: keyDoc.environment,
    };

    next();
  } catch (error: any) {
    next(new UnauthorizedError(error.message || 'Unauthorized API credential'));
  }
};
