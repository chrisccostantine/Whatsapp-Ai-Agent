import axios from "axios";
import { env } from "../config/env.js";

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

async function getShopifyAccessToken() {
  const now = Date.now();

  if (cachedAccessToken && now < cachedAccessTokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const url = `https://${env.shopifyShop}/admin/oauth/access_token`;

  const { data } = await axios.post(
    url,
    {
      client_id: env.shopifyClientId,
      client_secret: env.shopifyClientSecret,
      grant_type: "client_credentials",
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    },
  );

  if (!data?.access_token) {
    throw new Error("Failed to obtain Shopify access token");
  }

  cachedAccessToken = data.access_token;

  // Shopify docs say tokens expire after 24 hours.
  cachedAccessTokenExpiresAt = now + 24 * 60 * 60 * 1000;

  return cachedAccessToken;
}

export async function shopifyGraphQL(query, variables = {}) {
  const accessToken = await getShopifyAccessToken();

  const { data } = await axios.post(
    `https://${env.shopifyShop}/admin/api/${env.shopifyApiVersion}/graphql.json`,
    { query, variables },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      timeout: 30000,
    },
  );

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
