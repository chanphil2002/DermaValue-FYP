import { Request } from "express";
import { $Enums } from "@prisma/client";

type RequestWithUser = Request & {
  user: {
    userId: string;
    role: $Enums.UserRole;
    patientId?: string; // Optional field for patient ID
    clinicianId?: string; // Optional field for clinician ID
  };
};

export function assertHasUser(req: Request): asserts req is RequestWithUser {
  if (!("user" in req)) {
    throw new Error("Request object without user found unexpectedly");
  }
}