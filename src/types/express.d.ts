import { IUserIdentity } from './index';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      user?: IUserIdentity;
    }
  }
}
