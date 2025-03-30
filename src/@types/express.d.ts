import { UserRole } from "../enums/userRole";

console.log("Custom Express types loaded!");
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export {};
