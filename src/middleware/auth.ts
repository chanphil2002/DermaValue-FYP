import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import { $Enums } from "@prisma/client";

// Middleware to verify JWT and extract user data
export const authenticateJWT: RequestHandler = (req, res, next) => {
  try {
    // const token = req.headers.authorization?.split(" ")[1];
    const token = req.cookies.token;

    if (!token) return res.status(401).redirect("/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

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

export const clearAuthCookie: RequestHandler = (req, res, next) => {
  if (req.cookies.token) {
    // Clear the authentication token cookie if it's set
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // Set to true if using HTTPS
    });
  }
  next();
};
