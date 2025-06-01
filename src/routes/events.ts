// src/routes/events.ts
import { Router } from "express";
import * as ctrl from "../controllers/event.controller";
import { requireRole } from "../middleware/auth";

const router = Router();

router.post("/", requireRole("organizer"), ctrl.createEvent);
router.get("/", requireRole("organizer"), ctrl.listMyEvents);
router.get("/:id", requireRole("organizer"), ctrl.getEventById);
router.put("/:id", requireRole("organizer"), ctrl.updateEvent);
router.delete("/:id", requireRole("organizer"), ctrl.deleteEvent);
router.post("/:id/guests", requireRole("organizer"), ctrl.addGuest);
router.put(
  "/:id/guests/:guestId",
  requireRole("organizer"),
  ctrl.updateGuestStatus
);

export default router;
