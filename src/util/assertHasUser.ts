import { Request } from "express";
import { User } from "@prisma/client";

export function assertHasUser(req: Request): asserts req is Request & { user: User } {
  if (!("user" in req)) {
    throw new Error("Request object without user found unexpectedly");
  } else if (!req.user) {
    throw new Error("User is not authenticated");
  }
}