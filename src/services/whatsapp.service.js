import axios from "axios";
import { env } from "../config/env.js";

export async function sendWhatsAppText(to, body) {
  const url = `https://graph.facebook.com/v23.0/${env.whatsappPhoneNumberId}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    },
    {
      headers: {
        Authorization: `Bearer ${env.whatsappToken}`,
        "Content-Type": "application/json",
      },
    },
  );
}
