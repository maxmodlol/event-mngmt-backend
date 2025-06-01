// src/controllers/menu.controller.ts

import { Request, Response } from "express";
import MenuSection from "../models/MenuSection";
import MenuItem from "../models/MenuItem";
import { asyncHandler } from "../utils/asyncHandler";
import { IUser } from "../models/User";

// ─── 2.1 Create a new Menu Section ───────────────────────────────────────────────
// POST /api/vendors/:vendorId/menu/sections
export const createMenuSection = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = req.params.vendorId;
    const user = req.user as IUser;

    // 1) Only the same vendor can add their section
    if (user._id.toString() !== vendorId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Section name is required." });
    }

    const section = await MenuSection.create({
      vendor: vendorId,
      name: name.trim(),
    });

    res.status(201).json(section);
  }
);
export const getFullMenu = asyncHandler(async (req: Request, res: Response) => {
  const { vendorId } = req.params;

  // 1) Find all sections for this vendor:
  const sections = await MenuSection.find({ vendor: vendorId }).lean();

  // 2) For each section, fetch its items and tack them onto `items` field:
  const fullSections = await Promise.all(
    sections.map(async (sec) => {
      const items = await MenuItem.find({ section: sec._id }).lean();
      return {
        _id: sec._id,
        name: sec.name,
        items, // <-- each item is a Map with _id, name, description?, price, imageUrl
        createdAt: sec.createdAt,
        updatedAt: sec.updatedAt,
      };
    })
  );

  // 3) Return the combined array:
  res.json(fullSections);
});
// ─── 2.2 List all Sections for a Vendor ──────────────────────────────────────────
// GET /api/vendors/:vendorId/menu/sections
export const listMenuSections = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = req.params.vendorId;

    // No role check for read: let anyone view
    const sections = await MenuSection.find({ vendor: vendorId }).sort({
      createdAt: 1,
    });
    res.json(sections);
  }
);

// ─── 2.3 Update a Menu Section ───────────────────────────────────────────────────
// PUT /api/vendors/:vendorId/menu/sections/:sectionId
export const updateMenuSection = asyncHandler(
  async (req: Request, res: Response) => {
    const { vendorId, sectionId } = req.params;
    const user = req.user as IUser;

    if (user._id.toString() !== vendorId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Section name is required." });
    }

    const updated = await MenuSection.findOneAndUpdate(
      { _id: sectionId, vendor: vendorId },
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Section not found" });
    }

    res.json(updated);
  }
);

// ─── 2.4 Delete a Menu Section (and all its items) ───────────────────────────────
// DELETE /api/vendors/:vendorId/menu/sections/:sectionId
export const deleteMenuSection = asyncHandler(
  async (req: Request, res: Response) => {
    const { vendorId, sectionId } = req.params;
    const user = req.user as IUser;

    if (user._id.toString() !== vendorId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // 1) Delete all items under that section
    await MenuItem.deleteMany({ section: sectionId });

    // 2) Delete the section itself
    const deleted = await MenuSection.findOneAndDelete({
      _id: sectionId,
      vendor: vendorId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Section not found" });
    }

    res.sendStatus(204);
  }
);

// ─── 2.5 Create a Menu Item under a Section ──────────────────────────────────────
// POST /api/vendors/:vendorId/menu/sections/:sectionId/items
export const createMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { vendorId, sectionId } = req.params;
    const user = req.user as IUser;

    // 1) Only the owning vendor can add
    if (user._id.toString() !== vendorId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // 2) Verify that the section belongs to this vendor
    const section = await MenuSection.findOne({
      _id: sectionId,
      vendor: vendorId,
    });
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // 3) Pull fields from req.body
    //    We expect the client to send "name" and "price" (not dishName/dishPrice)
    console.log("bodty", req.body);
    const { name, description, price } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (price == null || isNaN(parseFloat(price))) {
      return res.status(400).json({ message: "Valid price is required." });
    }

    // 4) Handle the optional uploaded image file:
    let imageUrl: string | undefined;
    if (req.file) {
      // Save relative path so client can load it:
      // e.g. "/uploads/offerings/<filename>"
      const filename = req.file.filename;
      imageUrl = `/uploads/offerings/${filename}`;
    }

    // 5) Create the MenuItem document
    const item = await MenuItem.create({
      section: sectionId,
      name: name.trim(),
      description: description?.trim(),
      price: parseFloat(price),
      imageUrl,
    });

    res.status(201).json(item);
  }
);

// ─── 2.6 List all Items for a Section ────────────────────────────────────────────
// GET /api/vendors/:vendorId/menu/sections/:sectionId/items
export const listMenuItems = asyncHandler(
  async (req: Request, res: Response) => {
    const { vendorId, sectionId } = req.params;

    // 1) (Optional) you can check that the section belongs to that vendor—or just allow anyone to read
    const section = await MenuSection.findOne({
      _id: sectionId,
      vendor: vendorId,
    });
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    const items = await MenuItem.find({ section: sectionId }).sort({
      createdAt: 1,
    });
    res.json(items);
  }
);

// ─── 2.7 Update a Menu Item ─────────────────────────────────────────────────────
// PUT /api/vendors/:vendorId/menu/sections/:sectionId/items/:itemId
export const updateMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { vendorId, sectionId, itemId } = req.params;
    const user = req.user as IUser;

    // 1) Only owning vendor can update
    if (user._id.toString() !== vendorId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // 2) Verify that the item belongs to that section
    const existingItem = await MenuItem.findOne({
      _id: itemId,
      section: sectionId,
    });
    if (!existingItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // 3) Build an updates object based on body + file
    const updates: Partial<any> = {};

    if (req.body.name && req.body.name.trim().length) {
      updates.name = req.body.name.trim();
    }
    if (req.body.description) {
      updates.description = req.body.description.trim();
    }
    if (req.body.price != null && !isNaN(parseFloat(req.body.price))) {
      updates.price = parseFloat(req.body.price);
    }

    // 4) If a new image was uploaded under field “image”, update imageUrl
    if (req.file) {
      const filename = req.file.filename;
      updates.imageUrl = `/uploads/offerings/${filename}`;
    }

    // 5) Actually perform the update
    const updated = await MenuItem.findOneAndUpdate(
      { _id: itemId, section: sectionId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json(updated);
  }
);

// ─── 2.8 Delete a Menu Item ─────────────────────────────────────────────────────
// DELETE /api/vendors/:vendorId/menu/sections/:sectionId/items/:itemId
export const deleteMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { vendorId, sectionId, itemId } = req.params;
    const user = req.user as IUser;

    if (user._id.toString() !== vendorId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deleted = await MenuItem.findOneAndDelete({
      _id: itemId,
      section: sectionId,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.sendStatus(204);
  }
);
