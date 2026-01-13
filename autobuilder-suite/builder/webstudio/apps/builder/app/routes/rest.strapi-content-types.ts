/**
 * Strapi Content Types Discovery Route
 * 
 * This route provides an endpoint to discover all available
 * content types (collections) from the Strapi CMS.
 * 
 * This enables the Webstudio Resources panel to dynamically
 * show all available Strapi collections, including any new
 * ones created by the user.
 */

import { json } from "@remix-run/node";
import { strapi } from "~/services/strapi.server";

export const loader = async () => {
  try {
    // Check if Strapi is available
    const isAvailable = await strapi.isAvailable();
    
    if (!isAvailable) {
      return json(
        {
          available: false,
          contentTypes: [],
          error: "Strapi CMS is not available. Make sure it's running.",
        },
        { status: 503 }
      );
    }

    // Discover all content types
    const contentTypes = await strapi.discoverContentTypes();

    // Add useful metadata for the UI
    const enrichedTypes = contentTypes.map((ct) => ({
      ...ct,
      endpoint: `/rest/strapi/${ct.pluralName}?populate=*`,
      directEndpoint: `/api/${ct.pluralName}`,
      icon: getIconForContentType(ct.apiId),
      category: getCategoryForContentType(ct.apiId),
    }));

    return json(
      {
        available: true,
        contentTypes: enrichedTypes,
        count: enrichedTypes.length,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=30",
        },
      }
    );
  } catch (error) {
    console.error("Content types discovery error:", error);
    
    return json(
      {
        available: false,
        contentTypes: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

/**
 * Get a uniform icon for all content types (for consistency)
 */
function getIconForContentType(_apiId: string): string {
  // Use a consistent database/collection icon for all content types
  return "📊";
}

/**
 * Categorize content types for UI grouping
 */
function getCategoryForContentType(apiId: string): string {
  const categories: Record<string, string> = {
    // Content
    articles: "content",
    article: "content",
    posts: "content",
    post: "content",
    blogs: "content",
    blog: "content",
    pages: "content",
    page: "content",
    faqs: "content",
    faq: "content",
    news: "content",
    // Commerce
    products: "commerce",
    product: "commerce",
    items: "commerce",
    item: "commerce",
    services: "commerce",
    service: "commerce",
    offerings: "commerce",
    // Social/People
    "team-members": "social",
    "team-member": "social",
    teams: "social",
    team: "social",
    members: "social",
    member: "social",
    staff: "social",
    employees: "social",
    testimonials: "social",
    testimonial: "social",
    reviews: "social",
    review: "social",
    authors: "social",
    author: "social",
    contacts: "social",
    contact: "social",
    // Portfolio
    projects: "portfolio",
    project: "portfolio",
    portfolio: "portfolio",
    portfolios: "portfolio",
    works: "portfolio",
    work: "portfolio",
    gallery: "portfolio",
    galleries: "portfolio",
    // System
    "website-templates": "system",
    "website-template": "system",
    templates: "system",
    template: "system",
    categories: "system",
    category: "system",
    tags: "system",
    tag: "system",
  };

  return categories[apiId] || "other";
}
