import { config } from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import compression from "compression";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import timerRoutes from "./routes/timers.js";
import widgetRoutes from "./routes/widget.js";

// Load .env from the project root (helixo_task/) regardless of cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../.env") });

const PORT = parseInt(process.env.PORT || "3000", 10);

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

app.use(morgan("combined"));
app.use(compression());

// CORS — allow all origins for the public widget endpoint
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Shopify auth & webhook handlers
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} })
);

// ─── Public Widget Route (no Shopify auth) ───────────────────────────────────
app.use("/api/widget/timers", widgetRoutes);

// ─── Protected Routes (Shopify session required) ─────────────────────────────
app.use("/api/*", shopify.validateAuthenticatedSession());
app.use(express.json());

// Attach shop to req from session
app.use("/api/*", (req, res, next) => {
  req.shopifySession = res.locals.shopify?.session;
  next();
});

app.use("/api/timers", timerRoutes);

// ─── Frontend Static Files ───────────────────────────────────────────────────
const FRONTEND_BUILD = join(__dirname, "../frontend/dist");

app.use(serveStatic(FRONTEND_BUILD, { index: false }));

// SPA fallback — serve index.html for all non-API routes
app.get("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="/assets/index.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`
    );
});

// ─── Start Server ─────────────────────────────────────────────────────────────
connectMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
