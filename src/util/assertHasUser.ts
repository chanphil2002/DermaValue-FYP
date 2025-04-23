import { Request } from "express";
import { User } from "@prisma/client";

// export function assertHasUser(req: Request): asserts req is Request & { user: User } {
//   if (!("user" in req)) {
//     throw new Error("Request object without user found unexpectedly");
//   } else if (!req.user) {
//     throw new Error("User is not authenticated");
//   }
// }

// export function assertHasUser(req: Request, userRequired: boolean = true): asserts req is Request & { user: User } {
//   if (userRequired && (!("user" in req) || !req.user)) {
//     throw new Error("User is not authenticated");
//   }
// }

export function assertHasUser(req: Request, optional: boolean = false): asserts req is Request & { user: User } {
  if (!optional) {
    // If the user is not optional, ensure they are authenticated
    if (!("user" in req) || !req.user) {
      console.log("Hi Im here");
      throw new Error("User is not authenticated");
    }
  } else {
    // If user is optional, just return without throwing an error if user is not present
    if (!("user" in req)) {
      req.user = undefined; // Set user to undefined instead of null
    }
  }
}
