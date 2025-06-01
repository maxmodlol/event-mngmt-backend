// src/models/User.ts

import mongoose, { Document, Schema } from "mongoose";

export enum VendorServiceType {
  Decorator = "decorator",
  InteriorDesigner = "interior_designer",
  FurnitureStore = "furniture_store",
  Photographer = "photographer",
  Restaurant = "restaurant",
  GiftShop = "gift_shop",
  Entertainer = "entertainer",
  UNKNOWN = "unknown",
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "organizer" | "vendor" | "admin";
  phone: string; // newly added
  avatarUrl?: string; // newly added
  vendorProfile?: {
    serviceType: VendorServiceType;
    bio?: string;
    location?: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
  };
  fcmTokens: string[];
}
const VendorProfileSchema = new Schema(
  {
    serviceType: {
      type: String,
      enum: [
        "decorator",
        "interior_designer",
        "furniture_store",
        "photographer",
        "restaurant",
        "gift_shop",
        "entertainer",
        "unknown",
      ],
      required: true,
    },
    bio: { type: String },
    // Make `location` completely optional.
    // Only create it if you explicitly set both `type` and `coordinates`.
    location: {
      type: {
        type: String,
        enum: ["Point"],
        // ← Remove default. Only set “type” when you really want a GeoJSON object.
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["organizer", "vendor", "admin"],
      required: true,
    },
    phone: { type: String, required: true }, // new
    avatarUrl: { type: String, required: false }, // new
    vendorProfile: VendorProfileSchema,
    fcmTokens: { type: [String], default: [] },
  },
  { timestamps: true }
);
UserSchema.index({ "vendorProfile.location": "2dsphere" });

export default mongoose.model<IUser>("User", UserSchema);
