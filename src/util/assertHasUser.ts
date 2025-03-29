import { Request } from "express";
import { UserRole } from "../enums/userRole";

type RequestWithUser = Request & {
  user: {
    userId: string;
    role: UserRole;
  };
};

export function assertHasUser(req: Request): asserts req is RequestWithUser {
  if (!("user" in req)) {
    throw new Error("Request object without user found unexpectedly");
  }
}