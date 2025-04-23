import { User } from '@prisma/client'; // Import Prisma User type

declare global {
  namespace Express {
    interface Request {
      user?: User | null;  // 'user' is the Prisma User model (or null if not authenticated)
    }
  }
}

declare module 'express' {
  interface Request {
    flash(type: string, message: string | string[]): void;
    flash(type: string): string[];
  }
}