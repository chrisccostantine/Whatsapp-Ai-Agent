import cors from "cors";
import express from "express";

import healthRoutes from "./routes/health.routes.js";
import shopifyRoutes from "./routes/shopify.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import whatsappRoutes from "./routes/whatsapp.routes.js";

const app = express();

app.use(cors());

// Normal JSON routes
app.use("/api/health", healthRoutes);
app.use("/api/shopify", express.json(), shopifyRoutes);
app.use("/api/whatsapp", express.json(), whatsappRoutes);

// Raw body for webhook HMAC validation
app.use("/webhooks", express.raw({ type: "*/*" }), webhookRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Shopify WhatsApp Agent API running" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    ok: false,
    message: err.message || "Internal server error",
  });
});

export default app;
