// src/models/MenuSection.ts
import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User";

export interface IMenuSection extends Document {
  vendor: mongoose.Types.ObjectId; // reference back to User (vendor)
  name: string; // e.g. "Appetizers", "Main Courses"
  createdAt: Date;
  updatedAt: Date;
}

const MenuSectionSchema = new Schema<IMenuSection>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMenuSection>("MenuSection", MenuSectionSchema);
