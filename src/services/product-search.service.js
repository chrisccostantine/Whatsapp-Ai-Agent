import { db } from "../config/db.js";

export async function searchProducts({ q, size }) {
  let query = `
    SELECT 
      p.title,
      p.handle,
      p.product_url,
      p.image_url,
      v.price,
      v.option_size,
      v.inventory_quantity
    FROM shopify_products p
    JOIN shopify_variants v
      ON p.shopify_product_id = v.shopify_product_id
    WHERE p.status = 'ACTIVE'
  `;

  const params = [];

  // 🔍 Search by name (fuzzy)
  if (q) {
    query += ` AND LOWER(p.title) LIKE ?`;
    params.push(`%${q.toLowerCase()}%`);
  }

  // 🔍 Search by size (flexible)
  if (size) {
    query += ` AND v.option_size LIKE ?`;
    params.push(`%${size}%`);
  }

  // 🔥 Only in stock
  query += ` AND v.inventory_quantity > 0`;

  query += ` LIMIT 10`;

  const [rows] = await db.query(query, params);

  return rows;
}
