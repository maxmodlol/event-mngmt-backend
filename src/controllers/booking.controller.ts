// src/controllers/booking.controller.ts
import { Request, Response, NextFunction } from "express";
import Booking from "../models/Booking";
import { asyncHandler } from "../utils/asyncHandler";
import Offering from "../models/Offering";

// POST /api/bookings
export const createBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const organizerId = req.user!._id;
    const { event, offering, quantity } = req.body;
    // Optional: verify that organizer owns the event
    const booking = await Booking.create({ event, offering, quantity });
    res.status(201).json(booking);
  }
);

// GET /api/bookings?event=...  (organizer view)
export const listBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const { event } = req.query;
    if (!event)
      return res.status(400).json({ message: "Event ID is required" });
    const bookings = await Booking.find({ event }).populate({
      path: "offering",
      populate: { path: "vendor", select: "name" },
    });
    res.json(bookings);
  }
);

// PUT /api/bookings/:id/status  (vendor confirms/declines)
export const updateBookingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const bookingId = req.params.id;
    const { status } = req.body as { status: "confirmed" | "declined" };
    const booking = await Booking.findById(bookingId).populate("offering");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    // Check vendor owns the offering
    const offering = await Offering.findById(booking.offering);
    const user = req.user;
    if (offering!.vendor.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }
    booking.status = status;
    await booking.save();
    res.json(booking);
  }
);
