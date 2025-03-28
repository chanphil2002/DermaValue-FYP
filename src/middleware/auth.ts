import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface UserPayload {
  id: string;
  role: string;
}

// **JWT Authentication Middleware**
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1]; // Expect "Bearer <token>"

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return; // Ensure the response ends here
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      res.status(403).json({ message: "Forbidden" });
      return; // Ensure the response ends here
    }

    req.user = user as UserPayload; // Explicitly cast the user object
    next(); // Pass control to the next middleware
  });
};