import { db } from "../config/db.js";
import { fetchProductsPage } from "./shopify.service.js";

function normalizeOptionName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getOptionValueByAliases(options, aliases = []) {
  const normalizedAliases = aliases.map(normalizeOptionName);

  const match = options.find((opt) =>
    normalizedAliases.includes(normalizeOptionName(opt.name)),
  );

  return match ? String(match.value || "").trim() : null;
}

function toMySQLDateTime(value) {
  if (!value) return null;
  return value.replace("T", " ").replace("Z", "");
}

export async function syncProductsFromShopify() {
  let after = null;
  let hasNextPage = true;
  let productCount = 0;
  let variantCount = 0;

  while (hasNextPage) {
    const data = await fetchProductsPage(after);
    const edges = data.products.edges;

    for (const edge of edges) {
      const product = edge.node;

      await db.query(
        `
        INSERT INTO shopify_products
          (shopify_product_id, title, handle, vendor, status, product_url, image_url, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          handle = VALUES(handle),
          vendor = VALUES(vendor),
          status = VALUES(status),
          product_url = VALUES(product_url),
          image_url = VALUES(image_url),
          updated_at = VALUES(updated_at)
        `,
        [
          product.id,
          product.title,
          product.handle,
          product.vendor,
          product.status,
          `https://${process.env.SHOPIFY_SHOP.replace(".myshopify.com", "")}.com/products/${product.handle}`,
          product.featuredImage?.url || null,
          toMySQLDateTime(product.updatedAt),
        ],
      );

      productCount += 1;

      for (const variantEdge of product.variants.edges) {
        const variant = variantEdge.node;

        const size = getOptionValueByAliases(variant.selectedOptions, [
          "size",
          "shoe size",
        ]);

        const color = getOptionValueByAliases(variant.selectedOptions, [
          "color",
          "colour",
        ]);

        await db.query(
          `
          INSERT INTO shopify_variants
            (shopify_variant_id, shopify_product_id, title, sku, price, option_size, option_color, inventory_quantity, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            sku = VALUES(sku),
            price = VALUES(price),
            option_size = VALUES(option_size),
            option_color = VALUES(option_color),
            inventory_quantity = VALUES(inventory_quantity),
            updated_at = VALUES(updated_at)
          `,
          [
            variant.id,
            product.id,
            variant.title,
            variant.sku || null,
            variant.price,
            size,
            color,
            variant.inventoryQuantity ?? 0,
            toMySQLDateTime(variant.updatedAt),
          ],
        );

        variantCount += 1;
      }
    }

    hasNextPage = data.products.pageInfo.hasNextPage;
    after = data.products.pageInfo.endCursor;
  }

  return { productCount, variantCount };
}

export async function processShopifyWebhook({ topic, shop, payload }) {
  console.log("Shopify webhook:", topic, "from", shop);

  if (
    topic === "products/create" ||
    topic === "products/update" ||
    topic === "products/delete"
  ) {
    await syncProductsFromShopify();
  }
}
