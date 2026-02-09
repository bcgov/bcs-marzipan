import type { AuthUser } from '@corpcal/shared';
import type { DataScope } from '../policy/dto/user-context.dto';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      dataScope?: DataScope;
    }
  }
}

export {};
