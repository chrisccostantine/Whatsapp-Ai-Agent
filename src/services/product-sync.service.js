import { db } from "../config/db.js";
import { fetchProductsPage } from "./shopify.service.js";

function getOptionValue(options, targetName) {
  const match = options.find(
    (opt) => opt.name?.toLowerCase() === targetName.toLowerCase(),
  );
  return match ? match.value : null;
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
          product.updatedAt,
        ],
      );

      productCount += 1;

      for (const variantEdge of product.variants.edges) {
        const variant = variantEdge.node;
        const size = getOptionValue(variant.selectedOptions, "Size");
        const color = getOptionValue(variant.selectedOptions, "Color");

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
            variant.updatedAt,
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
