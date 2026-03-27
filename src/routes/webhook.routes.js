import { Router } from "express";
import {
  handleShopifyWebhook,
  handleWhatsAppWebhookMessage,
  handleWhatsAppWebhookVerify,
} from "../controllers/webhook.controller.js";

const router = Router();

// Shopify
router.post("/shopify", handleShopifyWebhook);

// WhatsApp verification
router.get("/whatsapp", handleWhatsAppWebhookVerify);

// WhatsApp inbound messages
router.post("/whatsapp", handleWhatsAppWebhookMessage);

export default router;
