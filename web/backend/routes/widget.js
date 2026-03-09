import express from "express";
import Timer from "../models/Timer.js";

const router = express.Router();

/**
 * GET /api/widget/timers?shop=my-store.myshopify.com
 * Public (no auth) — fetches the currently active timer for a given shop.
 * Called directly from the storefront by countdown-timer.js widget.
 */
router.get("/", async (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).json({ error: "Missing 'shop' query parameter" });
  }

  try {
    const now = new Date();

    // Find ONE active timer for this shop (active = now is between startDate and endDate)
    const timer = await Timer.findOne({
      shopDomain: shop,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });

    if (!timer) {
      return res.json({ timer: null });
    }

    res.json({ timer });
  } catch (err) {
    console.error("GET /api/widget/timers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
