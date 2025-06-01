// src/models/MenuItem.ts
import mongoose, { Document, Schema } from "mongoose";
import { IMenuSection } from "./MenuSection";

export interface IMenuItem extends Document {
  section: mongoose.Types.ObjectId; // reference to a MenuSection
  name: string; // dish name, e.g. "Hummus"
  description?: string; // optional description
  price: number; // e.g. 20.00
  imageUrl?: string; // optional URL to dish photo
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    section: {
      type: Schema.Types.ObjectId,
      ref: "MenuSection",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
