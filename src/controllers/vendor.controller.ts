// src/controllers/offering.controller.ts
import { Request, Response } from "express";
import Offering from "../models/Offering";
import { asyncHandler } from "../utils/asyncHandler";
import User, { IUser, VendorServiceType } from "../models/User";
import Booking from "../models/Booking";

export const listVendorBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = req.params.vendorId;
    // ensure vendor or admin
    const user = req.user as { _id: { toString(): string }; role: string };
    if (user._id.toString() !== vendorId && user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    // find offerings by this vendor
    const offerings = await Offering.find({ vendor: vendorId }).select("_id");
    const offeringIds = offerings.map((o) => o._id);

    // find bookings for those offerings
    const bookings = await Booking.find({ offering: { $in: offeringIds } })
      .populate("event", "title date")
      .populate("offering", "title price");

    res.json(bookings);
  }
);
// GET /api/vendors?lat=<>&lng=<>&radius=<km>
export const listVendors = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, radius } = req.query;
  if (lat && lng) {
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const km = radius ? parseFloat(radius as string) : 10;
    const meters = km * 1000;

    const vendors = await User.find({
      role: "vendor",
      "vendorProfile.location": {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: meters,
        },
      },
    }).select("name vendorProfile");

    return res.json(vendors);
  }
  // fallback: list all vendors
  const all = await User.find({ role: "vendor" }).select("name vendorProfile");
  res.json(all);
});

// POST to update a vendor's location
// PUT /api/vendors/:vendorId/location
// src/controllers/vendor.controller.ts

// src/controllers/vendor.controller.ts

// Note: make sure this route is protected by requireRole('vendor')
export const updateVendorLocation = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = req.params.vendorId;
    const user = req.user as IUser;

    // 1) Check ownership
    if (user._id.toString() !== vendorId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // 2) Parse & validate
    const { lat, lng } = req.body;
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // 3) Ensure vendorProfile exists
    if (!user.vendorProfile) {
      user.vendorProfile = {
        // we know this is a vendor, so serviceType must be defined
        serviceType: VendorServiceType.InteriorDesigner,
        bio: "",
        location: { type: "Point", coordinates: [longitude, latitude] },
      };
    } else {
      user.vendorProfile.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    // 4) Save and respond
    await user.save();
    return res.json({ message: "Location updated" });
  }
);

// POST /api/vendors/:vendorId/offerings
export const createOffering = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = req.params.vendorId;
    const user = req.user as IUser;
    if (user._id.toString() !== vendorId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Multer has already run, so:
    //   - req.body.title, req.body.description, req.body.price are available as strings
    //   - req.files is an array of uploaded files
    console.log("body:", req.body);
    console.log("files:", req.files);

    const { title, description, price } = req.body;
    if (!title || !price) {
      return res.status(400).json({ message: "عنوان وسعر مطلوبان" });
    }

    // Convert req.files → array of URL paths
    let images: string[] = [];
    console.log("req.files:", req.files);
    if (Array.isArray(req.files) && req.files.length > 0) {
      images = (req.files as Express.Multer.File[]).map((file) => {
        return `/uploads/offerings/${file.filename}`;
      });
    }

    const offering = await Offering.create({
      vendor: vendorId,
      title,
      description: description || "",
      images: images,
      price: parseFloat(price),
    });

    res.status(201).json(offering);
  }
);

// GET /api/vendors/:vendorId/offerings
export const listOfferingsByVendor = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = req.params.vendorId;
    const offerings = await Offering.find({ vendor: vendorId });
    res.json(offerings);
  }
);

// PUT /api/vendors/:vendorId/offerings/:offeringId
export const updateOffering = asyncHandler(
  async (req: Request, res: Response) => {
    const { vendorId, offeringId } = req.params;
    const user = req.user as IUser;
    if (user._id.toString() !== vendorId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // If images are included in this PUT, multer has already put them into req.files
    const updateData: Partial<any> = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.price) updateData.price = parseFloat(req.body.price);
    console.log("req.files:", req.files);

    // If new images were uploaded, build an array of paths:
    if (Array.isArray(req.files) && req.files.length > 0) {
      updateData.images = (req.files as Express.Multer.File[]).map((file) => {
        return `/uploads/offerings/${file.filename}`;
      });
    }

    const updated = await Offering.findOneAndUpdate(
      { _id: offeringId, vendor: vendorId },
      updateData,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Offering not found" });
    }
    res.json(updated);
  }
);

// DELETE /api/vendors/:vendorId/offerings/:offeringId
export const deleteOffering = asyncHandler(
  async (req: Request, res: Response) => {
    const { vendorId, offeringId } = req.params;
    const user = req.user as { _id: { toString(): string } };
    if (user._id.toString() !== vendorId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await Offering.findOneAndDelete({ _id: offeringId, vendor: vendorId });
    res.sendStatus(204);
  }
);
