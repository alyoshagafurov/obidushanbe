import { UserRole } from '@obi/shared';

/** Расширяем Request полем с авторизованным пользователем. */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        phone: string;
        isActive: boolean;
      };
    }
  }
}

export {};
