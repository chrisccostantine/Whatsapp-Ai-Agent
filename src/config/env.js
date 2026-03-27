import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",

  mysqlUrl: required("MYSQL_URL"),

  shopifyShop: required("SHOPIFY_SHOP"),
  shopifyAdminAccessToken: required("SHOPIFY_ADMIN_ACCESS_TOKEN"),
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION || "2026-01",
  shopifyWebhookSecret: required("SHOPIFY_WEBHOOK_SECRET"),

  openaiApiKey: required("OPENAI_API_KEY"),

  whatsappToken: required("WHATSAPP_TOKEN"),
  whatsappPhoneNumberId: required("WHATSAPP_PHONE_NUMBER_ID"),
  whatsappVerifyToken: required("WHATSAPP_VERIFY_TOKEN"),
  whatsappAppSecret: required("WHATSAPP_APP_SECRET"),
};
