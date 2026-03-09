import "@shopify/shopify-api/adapters/node";
import { shopifyApp } from "@shopify/shopify-app-express";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: (process.env.SCOPES || "read_products,write_script_tags").split(","),
    hostName: (process.env.HOST || "").replace(/https?:\/\//, ""),
    hostScheme: process.env.HOST?.startsWith("https") ? "https" : "http",
    apiVersion: "2024-01",
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new MongoDBSessionStorage(
    process.env.MONGODB_URI || "mongodb://localhost:27017",
    "countdown_timer_db"
  ),
});

export default shopify;
