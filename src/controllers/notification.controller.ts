import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";

// Save or update a user's FCM token
export const saveFcmToken = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }
    res.json({ message: "FCM token saved" });
  }
);

// Remove an FCM token (e.g. on logout)
export const removeFcmToken = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    user.fcmTokens = user.fcmTokens.filter((t) => t !== token);
    await user.save();
    res.json({ message: "FCM token removed" });
  }
);
