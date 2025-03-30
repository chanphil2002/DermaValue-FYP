import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import { $Enums } from "@prisma/client";

// Explicitly define a custom user type
interface AuthenticatedUser {
  userId: string;
  patientId?: string;
  clinicianId?: string;
  role: $Enums.UserRole;
}

// Middleware to verify JWT and extract user data
export const authenticateJWT: RequestHandler = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw createHttpError(401, "Access denied. No token provided.");

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthenticatedUser;

    req.user = decoded;

    next();
  } catch (error) {
    next(createHttpError(401, "Invalid or expired token"));
  }
};

// Middleware to check user role
export const authorizeRole = (allowedRoles: $Enums.UserRole[]): RequestHandler => {
  return (req, res, next) => {
    try {
      if (!req.user) throw createHttpError(401, "User not authenticated");

      const userRole = (req.user as { role: $Enums.UserRole }).role;

      if (!allowedRoles.includes(userRole)) {
        throw createHttpError(403, "Access denied. Insufficient permissions.");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
