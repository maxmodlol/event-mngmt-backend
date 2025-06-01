// src/app.ts

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Routers
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";
import vendorRoutes from "./routes/vendors";
import bookingRoutes from "./routes/bookings";
import notificationsRoutes from "./routes/notifications";
import menuRoutes from "./routes/menu"; // <— your “restaurant menu” router

// Middleware
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error";

import cors from "cors";
import morgan from "morgan";
import path from "path";

dotenv.config();

const app = express();
app.use(morgan("dev"));

// 1) Enable CORS
app.use(cors({ origin: "*" }));

// 2) Parse JSON bodies
app.use(express.json());

// 3) Serve uploaded files under “/uploads”
app.use("/api/uploads/", express.static(path.join(__dirname, "../uploads")));

// 4) Mount public/auth routes
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationsRoutes);

// 5) Mount protected routes (all require a valid JWT)
app.use("/api/events", requireAuth, eventRoutes);
app.use("/api/vendors", requireAuth, vendorRoutes);

// 6) Mount “restaurant menu” as a sub‐router of vendors (also protected)
app.use("/api/vendors/:vendorId/menu", requireAuth, menuRoutes);

// 7) Other protected routes
app.use("/api/bookings", requireAuth, bookingRoutes);

// 8) Global error handler
app.use(errorHandler);

// 9) Connect to MongoDB and start listening
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/eventmgmt";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
