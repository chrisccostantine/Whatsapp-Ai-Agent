import { db } from "../config/db.js";

export async function searchProducts({ q, size }) {
  const params = [];
  let sql = `
    SELECT
      p.id,
      p.shopify_product_id,
      p.title,
      p.vendor,
      p.product_url,
      p.image_url,
      v.shopify_variant_id,
      v.title AS variant_title,
      v.price,
      v.option_size,
      v.option_color,
      v.inventory_quantity
    FROM shopify_products p
    JOIN shopify_variants v
      ON v.shopify_product_id = p.shopify_product_id
    WHERE p.status = 'ACTIVE'
  `;

  if (q) {
    sql += ` AND (p.title LIKE ? OR p.vendor LIKE ? OR v.title LIKE ? OR v.sku LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  if (size) {
    sql += ` AND v.option_size = ?`;
    params.push(size);
  }

  sql += ` ORDER BY v.inventory_quantity DESC, p.updated_at DESC LIMIT 20`;

  const [rows] = await db.query(sql, params);
  return rows;
}
