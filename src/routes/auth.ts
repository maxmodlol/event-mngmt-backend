// src/routes/auth.ts

import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateMe,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);

// New: update the authenticated user
router.put("/me", requireAuth, updateMe);

export default router;
