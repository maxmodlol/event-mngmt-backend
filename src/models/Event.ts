// src/models/Event.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IGuest {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  status: "pending" | "yes" | "no";
}

export interface IEvent extends Document {
  organizer: mongoose.Types.ObjectId;
  title: string;
  date: Date;
  venue: string;
  guests: IGuest[];
  createdAt: Date;
  updatedAt: Date;
}

const GuestSchema = new Schema<IGuest>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "yes", "no"],
      default: "pending",
    },
  },
  { _id: true }
);

const EventSchema = new Schema<IEvent>(
  {
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    venue: { type: String, required: true },
    guests: { type: [GuestSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>("Event", EventSchema);
