import crypto from "crypto";
import { env } from "../config/env.js";
import { processShopifyWebhook } from "../services/product-sync.service.js";
import { processIncomingWhatsAppWebhook } from "../services/sales-agent.service.js";

function safeCompare(a, b) {
  const aBuf = Buffer.from(a || "", "utf8");
  const bBuf = Buffer.from(b || "", "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function handleShopifyWebhook(req, res) {
  const hmacHeader = req.get("x-shopify-hmac-sha256") || "";
  const digest = crypto
    .createHmac("sha256", env.shopifyWebhookSecret)
    .update(req.body)
    .digest("base64");

  if (!safeCompare(digest, hmacHeader)) {
    return res.status(401).send("Invalid Shopify webhook signature");
  }

  const topic = req.get("x-shopify-topic") || "";
  const shop = req.get("x-shopify-shop-domain") || "";
  const payload = JSON.parse(req.body.toString("utf8"));

  await processShopifyWebhook({ topic, shop, payload });

  return res.status(200).send("OK");
}

export function handleWhatsAppWebhookVerify(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.whatsappVerifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
}

export async function handleWhatsAppWebhookMessage(req, res) {
  const payload = JSON.parse(req.body.toString("utf8"));
  await processIncomingWhatsAppWebhook(payload);
  res.status(200).send("EVENT_RECEIVED");
}
