// src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadAvatar } from "../middleware/multer";
const JWT_EXPIRES_IN = "7d";

// ─── Multer setup (same as before) ───────────────────────────────────────────────

// ─── Existing register, login, getMe (unchanged) ────────────────────────────────
// (As in your previous code)
export const register = [
  uploadAvatar.single("profileImage"),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, role, phone, vendorProfile } = req.body;
    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: "جميع الحقول مطلوبة." });
    }

    // 1) Prevent duplicate emails
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: "هذا البريد الإلكتروني مستخدم بالفعل." });
    }

    // 2) Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3) If multer gave us a file, save its URL path
    let avatarUrl: string | undefined;
    if (req.file) {
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    // 4) Build the new user object
    const userFields: Partial<IUser> = {
      name,
      email,
      passwordHash,
      role,
      phone,
      avatarUrl,
    };

    // 5) If vendor, parse vendorProfile JSON‐string into an object
    if (role === "vendor" && vendorProfile) {
      try {
        userFields.vendorProfile = JSON.parse(vendorProfile);
      } catch {
        return res
          .status(400)
          .json({ message: "تنسيق vendorProfile غير صحيح." });
      }
    }

    // 6) Save new user in the database
    const user = new User(userFields);
    await user.save();

    // 7) Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // 8) Return token + user info. (We omit passwordHash, include phone + avatarUrl, etc.)
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl || null,
        vendorProfile: user.vendorProfile || null, // ← include this so Flutter knows the serviceType immediately
      },
    });
  }),
];
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "الرجاء إدخال البريد وكلمة المرور." });
  }

  // 1) Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "بيانات الاعتماد غير صحيحة." });
  }

  // 2) Compare password
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "بيانات الاعتماد غير صحيحة." });
  }

  // 3) Generate JWT
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN,
  });

  // 4) Return token + user info (including phone + avatarUrl + vendorProfile)
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl || null,
      vendorProfile: user.vendorProfile || null,
    },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as IUser;
  if (!user) {
    return res.status(401).json({ message: "غير مسجل الدخول." });
  }

  // Return all relevant fields, exactly as Flutter’s `User.fromJson` expects:
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl || null,
    vendorProfile: user.vendorProfile || null,
  });
});

// ─── 3.5 New: updateMe Controller ───────────────────────────────────────────────

/**
 * PUT /api/auth/me
 * Protected. Accepts multipart/form-data with optional `profileImage`.
 * Body can include: { name, email, phone } to update. If `role` should not be editable, omit it.
 */
export const updateMe = [
  uploadAvatar.single("profileImage"),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as IUser).id; // typed as IUser

    // Build an update object (Partial<IUser>)
    const updates: Partial<IUser> = {};

    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.phone) updates.phone = req.body.phone;
    // We do NOT allow role changes here for security.

    if (req.file) {
      updates.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    // 1) If email is changing, ensure uniqueness
    if (updates.email) {
      const existing = await User.findOne({
        email: updates.email,
        _id: { $ne: userId },
      });
      if (existing) {
        return res
          .status(409)
          .json({ message: "هذا البريد الإلكتروني مستخدم بالفعل." });
      }
    }

    // 2) Perform the update
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود." });
    }

    // 3) Send back the updated user (same shape as getMe)
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl || null,
      vendorProfile: user.vendorProfile || null,
    });
  }),
];
