import express from "express";
import Timer from "../models/Timer.js";

const router = express.Router();

// Middleware to extract shop from Shopify session
const getShopDomain = (req) => {
  // Shopify session is attached by @shopify/shopify-app-express middleware
  return req.shopifySession?.shop || req.query.shop || null;
};

// GET /api/timers — list all timers for authenticated shop
router.get("/", async (req, res) => {
  try {
    const shopDomain = getShopDomain(req);
    if (!shopDomain) {
      return res.status(401).json({ error: "Unauthorized: no shop session" });
    }

    const timers = await Timer.find({ shopDomain }).sort({ createdAt: -1 });
    res.json({ timers });
  } catch (err) {
    console.error("GET /api/timers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/timers — create a new timer
router.post("/", async (req, res) => {
  try {
    const shopDomain = getShopDomain(req);
    if (!shopDomain) {
      return res.status(401).json({ error: "Unauthorized: no shop session" });
    }

    const {
      name,
      startDate,
      endDate,
      description,
      color,
      size,
      position,
      urgencyType,
      urgencyThresholdMinutes,
    } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: "name, startDate and endDate are required" });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ error: "endDate must be after startDate" });
    }

    const timer = new Timer({
      shopDomain,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description,
      color,
      size,
      position,
      urgencyType,
      urgencyThresholdMinutes,
    });

    await timer.save();
    res.status(201).json({ timer });
  } catch (err) {
    console.error("POST /api/timers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/timers/:id — update a timer
router.put("/:id", async (req, res) => {
  try {
    const shopDomain = getShopDomain(req);
    if (!shopDomain) {
      return res.status(401).json({ error: "Unauthorized: no shop session" });
    }

    const timer = await Timer.findOne({ _id: req.params.id, shopDomain });
    if (!timer) {
      return res.status(404).json({ error: "Timer not found" });
    }

    const {
      name,
      startDate,
      endDate,
      description,
      color,
      size,
      position,
      urgencyType,
      urgencyThresholdMinutes,
    } = req.body;

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ error: "endDate must be after startDate" });
    }

    Object.assign(timer, {
      ...(name && { name }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(size && { size }),
      ...(position && { position }),
      ...(urgencyType && { urgencyType }),
      ...(urgencyThresholdMinutes !== undefined && { urgencyThresholdMinutes }),
    });

    await timer.save();
    res.json({ timer });
  } catch (err) {
    console.error("PUT /api/timers/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/timers/:id — delete a timer
router.delete("/:id", async (req, res) => {
  try {
    const shopDomain = getShopDomain(req);
    if (!shopDomain) {
      return res.status(401).json({ error: "Unauthorized: no shop session" });
    }

    const result = await Timer.findOneAndDelete({ _id: req.params.id, shopDomain });
    if (!result) {
      return res.status(404).json({ error: "Timer not found" });
    }

    res.json({ success: true, message: "Timer deleted" });
  } catch (err) {
    console.error("DELETE /api/timers/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
