import { Router } from "express";
import {
  createBooking,
  listBookings,
  updateBookingStatus,
} from "../controllers/booking.controller";
import { requireRole } from "../middleware/auth";

const router = Router();

// Organizer books an offering
router.post("/", requireRole("organizer"), createBooking);

// Organizer views bookings for an event
router.get("/", requireRole("organizer"), listBookings);

// Vendor updates booking status
router.put("/:id/status", requireRole("vendor"), updateBookingStatus);

export default router;
