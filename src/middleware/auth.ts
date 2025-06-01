// src/middleware/auth.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

interface JwtPayload {
  userId: string;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return; // <— just return void, don’t return the res
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET!, async (err, payload) => {
    if (
      err ||
      !payload ||
      typeof payload !== "object" ||
      !("userId" in payload)
    ) {
      res.status(401).json({ message: "Unauthorized" });
      return; // <— same here
    }
    try {
      const user = await User.findById((payload as JwtPayload).userId);
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return; // <— same here
      }
      req.user = user;
      next();
    } catch {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
};

export const requireRole = (
  role: "organizer" | "vendor" | "admin"
): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return; // <— void return
    }
    if (req.user.role !== role) {
      res.status(403).json({ message: "Forbidden" });
      return; // <— void return
    }
    next(); // <— also void
  };
};
