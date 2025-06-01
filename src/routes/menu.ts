// src/routes/menu.ts
import { Router } from "express";
import {
  createMenuSection,
  listMenuSections,
  updateMenuSection,
  deleteMenuSection,
  createMenuItem,
  listMenuItems,
  updateMenuItem,
  deleteMenuItem,
  getFullMenu, // ← import the new method
} from "../controllers/menu.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { uploadOfferingImages } from "../middleware/multer";

const router = Router({ mergeParams: true });

// All menu routes assume the path prefix is /api/vendors/:vendorId/menu
router.use(requireAuth); // Must be logged in
router.use(requireRole("vendor")); // Must have vendor role

// ─── Return “sections + items” in one shot ─────────────────────────────────────────
router.get("/", getFullMenu);
// Now a client can do GET /api/vendors/:vendorId/menu
// and receive an array of { _id, name, items: [ … ] }.

// ─── Section endpoints (no file upload here) ───────────────────────────────────────
router.post("/sections", createMenuSection);
router.get("/sections", listMenuSections);
router.put("/sections/:sectionId", updateMenuSection);
router.delete("/sections/:sectionId", deleteMenuSection);

// ─── Item endpoints (with image‐upload) ────────────────────────────────────────────
router.post(
  "/sections/:sectionId/items",
  uploadOfferingImages.single("image"),
  createMenuItem
);
router.get("/sections/:sectionId/items", listMenuItems);
router.put(
  "/sections/:sectionId/items/:itemId",
  uploadOfferingImages.single("image"),
  updateMenuItem
);
router.delete("/sections/:sectionId/items/:itemId", deleteMenuItem);

export default router;
