import axios from "axios";
import { env } from "../config/env.js";

const shopifyClient = axios.create({
  baseURL: `https://${env.shopifyShop}/admin/api/${env.shopifyApiVersion}/graphql.json`,
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": env.shopifyAdminAccessToken,
  },
  timeout: 30000,
});

export async function shopifyGraphQL(query, variables = {}) {
  const { data } = await shopifyClient.post("", { query, variables });

  if (data.errors?.length) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  if (data.data == null) {
    throw new Error("Shopify GraphQL returned no data");
  }

  return data.data;
}

export async function fetchProductsPage(after = null) {
  const query = `
    query FetchProducts($after: String) {
      products(first: 50, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            vendor
            status
            updatedAt
            featuredImage {
              url
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  sku
                  price
                  inventoryQuantity
                  updatedAt
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  return shopifyGraphQL(query, { after });
}
