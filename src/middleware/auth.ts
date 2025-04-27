import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import { $Enums } from "@prisma/client";

// Middleware to verify JWT and extract user data
export const authenticateJWT: RequestHandler = (req, res, next) => {
  const publicRoutes = ["/", "/leaderboard", "/clinics"];

  // Allow public routes without requiring login
  const isPublicRoute = publicRoutes.some(route => req.originalUrl.startsWith(route));

  try {
    const token = req.cookies.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
    } else if (!isPublicRoute) {
      // If not a public route and no token, redirect to login
      return res.status(401).redirect("/login");
    }

    next(); // Always continue
  } catch (error) {
    // Token is invalid or expired
    if (isPublicRoute) {
      return next(); // Still allow guest access
    }

    next(createHttpError(401, "Invalid or expired token"));
  }
};

// Middleware to check user role
export const authorizeRole = (allowedRoles: $Enums.UserRole[]): RequestHandler => {
  return (req, res, next) => {
    try {
      if (!req.user) res.status(401).redirect("/login");

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
