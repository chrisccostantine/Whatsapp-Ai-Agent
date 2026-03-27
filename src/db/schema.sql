CREATE TABLE IF NOT EXISTS shopify_products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  shopify_product_id VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  handle VARCHAR(255) NOT NULL,
  vendor VARCHAR(255) NULL,
  status VARCHAR(50) NOT NULL,
  product_url TEXT NULL,
  image_url TEXT NULL,
  updated_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shopify_variants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  shopify_variant_id VARCHAR(100) NOT NULL UNIQUE,
  shopify_product_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  sku VARCHAR(255) NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  option_size VARCHAR(50) NULL,
  option_color VARCHAR(100) NULL,
  inventory_quantity INT NOT NULL DEFAULT 0,
  updated_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_variant_product_id (shopify_product_id),
  INDEX idx_variant_size (option_size),
  INDEX idx_variant_sku (sku)
);

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(255) NULL,
  lead_status VARCHAR(50) NOT NULL DEFAULT 'new_lead',
  last_message_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  direction ENUM('inbound', 'outbound') NOT NULL,
  message_text TEXT NOT NULL,
  whatsapp_message_id VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_customer_id (customer_id),
  CONSTRAINT fk_messages_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  intent VARCHAR(50) NOT NULL,
  matched_variant_id VARCHAR(100) NULL,
  action_taken VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agent_logs_customer_id (customer_id),
  CONSTRAINT fk_agent_logs_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE
);