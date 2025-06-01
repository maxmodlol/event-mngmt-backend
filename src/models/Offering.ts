// src/models/Offering.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IOffering extends Document {
  vendor: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  images: string[];
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const OfferingSchema = new Schema<IOffering>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    images: { type: [String], default: [] },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IOffering>("Offering", OfferingSchema);
