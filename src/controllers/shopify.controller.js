import { searchProducts } from "../services/product-search.service.js";
import { syncProductsFromShopify } from "../services/product-sync.service.js";

export async function syncProductsController(req, res) {
  const result = await syncProductsFromShopify();
  res.json({ ok: true, ...result });
}

export async function searchProductsController(req, res) {
  const q = String(req.query.q || "").trim();
  const size = req.query.size ? String(req.query.size).trim() : null;

  const rows = await searchProducts({ q, size });
  res.json({ ok: true, count: rows.length, items: rows });
}
