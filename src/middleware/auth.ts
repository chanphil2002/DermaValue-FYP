import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import { UserRole } from "../enums/userRole";

// Explicitly define a custom user type
interface AuthenticatedUser {
  userId: string;
  role: UserRole;
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
export const authorizeRole = (allowedRoles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    try {
      if (!req.user) throw createHttpError(401, "User not authenticated");

      if (!allowedRoles.includes(req.user.role)) {
        throw createHttpError(403, "Access denied. Insufficient permissions.");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
