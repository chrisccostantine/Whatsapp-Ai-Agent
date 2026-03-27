import OpenAI from "openai";
import { env } from "../config/env.js";

const client = new OpenAI({
  apiKey: env.openaiApiKey,
});

export async function generateSalesReply({
  customerMessage,
  intent,
  products,
}) {
  const safeProducts = products.slice(0, 3).map((p) => ({
    product: p.title,
    variant: p.variant_title,
    size: p.option_size,
    color: p.option_color,
    price: p.price,
    stock: p.inventory_quantity,
    link: p.product_url,
  }));

  const prompt = `
You are a WhatsApp sales agent for a Shopify store.

Rules:
- Keep the reply short.
- Never invent product data.
- Use only the products provided.
- If a matching item exists, mention price and link.
- If stock is 0, say it's unavailable.
- Try to move the customer toward buying.
- Support English or Arabic depending on the customer's message.

Customer message:
${customerMessage}

Intent:
${intent}

Products:
${JSON.stringify(safeProducts, null, 2)}
`;

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  return response.output_text?.trim() || "A team member will help you shortly.";
}
