import { db } from "../config/db.js";
import { env } from "../config/env.js";

function toCanonicalProductUrl(productUrl, handle) {
  const locale = String(env.shopifyStorefrontLocale || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  const localePrefix = locale ? `/${locale}` : "";
  const domain = String(env.shopifyStorefrontDomain || "markastorelb.com")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");

  let productHandle = String(handle || "").trim();

  if (productUrl) {
    try {
      const parsed = new URL(productUrl);
      const fromPath = parsed.pathname.match(/\/products\/([^/?#]+)/i)?.[1];
      if (fromPath) productHandle = fromPath;
    } catch {
      // ignore invalid URL and keep fallback handle
    }
  }

  return `https://${domain}${localePrefix}/products/${productHandle}`;
}
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
    query += ` AND (v.option_size LIKE ? OR v.title LIKE ?)`;
    params.push(`%${size}%`, `%${size}%`);
  }

  // 🔥 Only in stock
  query += ` AND v.inventory_quantity > 0`;

  query += ` LIMIT 10`;

  const [rows] = await db.query(query, params);

  return rows.map((row) => ({
    ...row,
    product_url: toCanonicalProductUrl(row.product_url, row.handle),
  }));
}
