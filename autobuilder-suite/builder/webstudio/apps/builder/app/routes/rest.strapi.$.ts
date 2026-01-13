/**
 * Strapi CMS API Proxy Route
 * 
 * This route provides a server-side proxy to the Strapi CMS,
 * enabling Webstudio Resources feature to fetch content from Strapi
 * without exposing the Strapi URL directly to the client.
 * 
 * Usage in Webstudio Resources:
 * - URL: /rest/strapi/:collection
 * - Example: /rest/strapi/articles
 * - Query params: All Strapi query params are supported
 * 
 * Dynamic Collection Discovery:
 * - Any collection that exists in Strapi can be accessed
 * - New collections created in Strapi admin are automatically available
 */

import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { strapi } from "~/services/strapi.server";
import env from "~/env/env.server";

// Helper to transform relative URLs to absolute
function makeAbsoluteUrl(url: string): string {
  if (url.startsWith("http")) {
    return url;
  }
  return `${env.STRAPI_URL}${url}`;
}

// Collections that are blocked for security (admin-only content)
const BLOCKED_COLLECTIONS = [
  "admin",
  "users",
  "users-permissions",
  "upload",
  "i18n",
  "content-releases",
  "content-type-builder",
  "audit-logs",
  "roles",
  "permissions",
];

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const collection = params["*"];

  if (!collection) {
    return json(
      { error: "Collection name is required" },
      { status: 400 }
    );
  }

  // Security check: block admin/system collections
  const collectionName = collection.split("/")[0];
  if (BLOCKED_COLLECTIONS.includes(collectionName)) {
    return json(
      { error: `Collection '${collectionName}' is not accessible` },
      { status: 403 }
    );
  }

  try {
    // Check if this is a request for a single item (e.g., articles/abc123)
    const parts = collection.split("/");
    const isSingleItem = parts.length > 1;

    // Parse query parameters
    const filters = parseFilters(url.searchParams);
    const populate = url.searchParams.get("populate") ?? "*";
    const sort = url.searchParams.get("sort")?.split(",") ?? undefined;
    const page = url.searchParams.get("page");
    const pageSize = url.searchParams.get("pageSize");
    const fields = url.searchParams.get("fields")?.split(",") ?? undefined;

    if (isSingleItem) {
      // Get single item by document ID
      const documentId = parts[1];
      const response = await strapi.getOne(collectionName, documentId, {
        populate,
        fields,
      });

      return json(transformResponse(response), {
        headers: getCacheHeaders(),
      });
    }

    // Get collection
    const response = await strapi.getCollection(collectionName, {
      filters,
      populate,
      sort,
      pagination: {
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      },
      fields,
    });

    return json(transformResponse(response), {
      headers: getCacheHeaders(),
    });
  } catch (error) {
    console.error("Strapi API error:", error);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    return json(
      { error: "Failed to fetch from Strapi", details: message },
      { status: 500 }
    );
  }
};

/**
 * Parse filter parameters from URL search params
 * Supports patterns like: filters[field][$eq]=value
 */
function parseFilters(
  searchParams: URLSearchParams
): Record<string, unknown> | undefined {
  const filters: Record<string, unknown> = {};

  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("filters[")) {
      const match = key.match(/filters\[([^\]]+)\](?:\[([^\]]+)\])?/);
      if (match) {
        const [, field, operator] = match;
        if (operator) {
          filters[field] = { [operator]: value };
        } else {
          filters[field] = { $eq: value };
        }
      }
    }
  }

  return Object.keys(filters).length > 0 ? filters : undefined;
}

/**
 * Transform Strapi response to ensure image URLs are absolute
 */
function transformResponse<T>(response: { data: T; meta?: unknown }): {
  data: T;
  meta?: unknown;
} {
  const transformItem = (item: Record<string, unknown>): Record<string, unknown> => {
    const transformed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(item)) {
      if (value && typeof value === "object") {
        // Check if it's a media field (has url property)
        if ("url" in value && typeof (value as Record<string, unknown>).url === "string") {
          const mediaValue = value as Record<string, unknown>;
          transformed[key] = {
            ...mediaValue,
            url: makeAbsoluteUrl(mediaValue.url as string),
            formats: transformFormats(mediaValue.formats as Record<string, unknown> | undefined),
          };
        } else if (Array.isArray(value)) {
          // Handle arrays (including media arrays)
          transformed[key] = value.map((v) =>
            typeof v === "object" && v !== null ? transformItem(v as Record<string, unknown>) : v
          );
        } else {
          // Recurse for nested objects
          transformed[key] = transformItem(value as Record<string, unknown>);
        }
      } else {
        transformed[key] = value;
      }
    }

    return transformed;
  };

  const transformFormats = (formats: Record<string, unknown> | undefined) => {
    if (!formats) return undefined;

    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formats)) {
      if (value && typeof value === "object" && "url" in value) {
        const formatValue = value as Record<string, unknown>;
        transformed[key] = {
          ...formatValue,
          url: makeAbsoluteUrl(formatValue.url as string),
        };
      }
    }
    return transformed;
  };

  if (Array.isArray(response.data)) {
    return {
      data: response.data.map((item) =>
        transformItem(item as Record<string, unknown>)
      ) as T,
      meta: response.meta,
    };
  }

  return {
    data: transformItem(response.data as Record<string, unknown>) as T,
    meta: response.meta,
  };
}

/**
 * Get cache headers for the response
 */
function getCacheHeaders(): HeadersInit {
  return {
    "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
  };
}
