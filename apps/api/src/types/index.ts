// Backend-only type extensions
import type { UserRole } from '@repo/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  stationId?: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
