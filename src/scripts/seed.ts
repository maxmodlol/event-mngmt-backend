// src/scripts/seed.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import User, { IUser } from "../models/User";
import Event from "../models/Event";
import Offering from "../models/Offering";
import Booking from "../models/Booking";

dotenv.config();

async function connectDb() {
  const MONGO_URI =
    process.env.MONGO_URI || "mongodb://localhost:27017/eventmgmt";
  await mongoose.connect(MONGO_URI);
  console.log("🗄️  Connected to MongoDB");
}

async function clearData() {
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Offering.deleteMany({}),
    Booking.deleteMany({}),
  ]);
  console.log("🧹 Cleared existing data");
}

async function createSample() {
  // 1) Create users
  const passwordHash = await bcrypt.hash("pass123", 10);
  const organizer = await User.create({
    name: "Alice",
    email: "alice@org.com",
    passwordHash,
    role: "organizer",
  });
  const vendor = await User.create({
    name: "Bob Decor",
    email: "bob@vendor.com",
    passwordHash,
    role: "vendor",
    vendorProfile: { serviceType: "decorator", bio: "I decorate events" },
  });
  console.log("👤 Created users");

  // 2) Create an event
  const event = await Event.create({
    organizer: organizer._id,
    title: "Launch Party",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    venue: "Main Hall",
  });
  console.log("🎉 Created event");

  // 3) Create an offering
  const offering = await Offering.create({
    vendor: vendor._id,
    title: "Balloon Arch",
    description: "Colorful balloon arch",
    images: [],
    price: 150,
  });
  console.log("🎁 Created offering");

  // 4) Book the offering
  const booking = await Booking.create({
    event: event._id,
    offering: offering._id,
    quantity: 1,
  });
  console.log("📦 Created booking");

  console.log(`
🚀 Sample data:
- organizer email: alice@org.com, pass: pass123
- vendor email: bob@vendor.com, pass: pass123
- event id: ${event._id}
- offering id: ${offering._id}
- booking id: ${booking._id}
`);
}

async function seed() {
  try {
    await connectDb();
    await clearData();
    await createSample();
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Seed script completed, exiting.");
    process.exit(0); // <-- force the process to quit
  }
}

seed();

// Add to package.json:
// "scripts": {
//   "seed": "ts-node-dev --respawn --transpile-only src/scripts/seed.ts"
// }
