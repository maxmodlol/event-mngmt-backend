// src/routes/vendors.ts
import { Router } from "express";
import {
  createOffering,
  listOfferingsByVendor,
  updateOffering,
  deleteOffering,
  listVendors,
  updateVendorLocation,
  listVendorBookings,
} from "../controllers/vendor.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { uploadOfferingImages } from "../middleware/multer";

const router = Router();

// Public or authenticated listing w/ optional geo-filter
router.get("/", requireAuth, listVendors);

router.get("/:vendorId/bookings", requireRole("vendor"), listVendorBookings);

// Vendor updates their location
router.put("/:vendorId/location", requireRole("vendor"), updateVendorLocation);

// Create a new offering (vendor only)
router.post(
  "/:vendorId/offerings",
  requireAuth,
  requireRole("vendor"),
  uploadOfferingImages.array("images", 5), // now Multer runs here
  createOffering
);
// List offerings for a vendor (authenticated users)
router.get("/:vendorId/offerings", listOfferingsByVendor);

// Update an offering (vendor only
router.put(
  "/:vendorId/offerings/:offeringId",
  requireAuth,
  requireRole("vendor"),
  uploadOfferingImages.array("images", 5), // now Multer runs here
  updateOffering
);

// Delete an offering (vendor only)
router.delete(
  "/:vendorId/offerings/:offeringId",
  requireRole("vendor"),
  deleteOffering
);

export default router;
