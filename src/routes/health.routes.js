import { Router } from "express";
import { db } from "../config/db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ ok: true });
});

router.get("/init-db", async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS shopify_products (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        shopify_product_id VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        handle VARCHAR(255) NOT NULL,
        vendor VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        product_url TEXT,
        image_url TEXT,
        updated_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS shopify_variants (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        shopify_variant_id VARCHAR(100) NOT NULL UNIQUE,
        shopify_product_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        sku VARCHAR(255),
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        option_size VARCHAR(50),
        option_color VARCHAR(100),
        inventory_quantity INT NOT NULL DEFAULT 0,
        updated_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(30) NOT NULL UNIQUE,
        name VARCHAR(255),
        lead_status VARCHAR(50) NOT NULL DEFAULT 'new_lead',
        last_message_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        customer_id BIGINT UNSIGNED NOT NULL,
        direction ENUM('inbound', 'outbound') NOT NULL,
        message_text TEXT NOT NULL,
        whatsapp_message_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_messages_customer_id (customer_id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS agent_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        customer_id BIGINT UNSIGNED NOT NULL,
        intent VARCHAR(50) NOT NULL,
        matched_variant_id VARCHAR(100),
        action_taken VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_agent_logs_customer_id (customer_id)
      )
    `);

    res.json({ ok: true, message: "Tables created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
