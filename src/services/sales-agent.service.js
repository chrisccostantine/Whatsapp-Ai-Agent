import { db } from "../config/db.js";
import { generateSalesReply } from "./openai.service.js";
import { searchProducts } from "./product-search.service.js";
import { sendWhatsAppText } from "./whatsapp.service.js";

function extractCustomerText(payload) {
  try {
    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return null;

    const from = message.from;
    const text = message.text?.body || "";
    return { from, text };
  } catch {
    return null;
  }
}

function detectIntent(text) {
  const t = text.toLowerCase();

  if (/\b(price|how much|سعر|قديش)\b/.test(t)) return "price";
  if (/\b(size|مقاس|قياس)\b/.test(t)) return "size";
  if (/\b(link|لينك|رابط)\b/.test(t)) return "link";
  if (/\b(available|have|موجود|متوفر)\b/.test(t)) return "availability";

  return "general";
}

function extractSize(text) {
  const match = text.match(/\b(3[5-9]|4[0-9]|50)\b/);
  return match ? match[1] : null;
}

export async function processIncomingWhatsAppWebhook(payload) {
  const parsed = extractCustomerText(payload);
  if (!parsed) return;

  const { from, text } = parsed;
  const intent = detectIntent(text);
  const size = extractSize(text);

  const [customerResult] = await db.query(
    `
    INSERT INTO customers (phone, lead_status, last_message_at)
    VALUES (?, 'new_lead', NOW())
    ON DUPLICATE KEY UPDATE
      last_message_at = NOW()
    `,
    [from],
  );

  const [[customer]] = await db.query(
    `SELECT id FROM customers WHERE phone = ? LIMIT 1`,
    [from],
  );

  await db.query(
    `INSERT INTO messages (customer_id, direction, message_text) VALUES (?, 'inbound', ?)`,
    [customer.id, text],
  );

  const products = await searchProducts({ q: text, size });

  const reply = await generateSalesReply({
    customerMessage: text,
    intent,
    products,
  });

  await sendWhatsAppText(from, reply);

  await db.query(
    `INSERT INTO messages (customer_id, direction, message_text) VALUES (?, 'outbound', ?)`,
    [customer.id, reply],
  );

  await db.query(
    `
    INSERT INTO agent_logs (customer_id, intent, matched_variant_id, action_taken)
    VALUES (?, ?, ?, ?)
    `,
    [
      customer.id,
      intent,
      products[0]?.shopify_variant_id || null,
      "auto_reply_sent",
    ],
  );
}
