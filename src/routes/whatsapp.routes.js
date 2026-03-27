import { Router } from "express";
import { sendWhatsAppText } from "../services/whatsapp.service.js";

const router = Router();

router.post("/send-test", async (req, res) => {
  try {
    const { to, message } = req.body;

    await sendWhatsAppText(
      to,
      message || "Hello from your AI WhatsApp agent 🚀",
    );

    res.json({
      ok: true,
      message: "WhatsApp message sent successfully",
    });
  } catch (error) {
    console.error("send-test error:", error.response?.data || error.message);
    res.status(500).json({
      ok: false,
      error: error.response?.data || error.message,
    });
  }
});

export default router;
