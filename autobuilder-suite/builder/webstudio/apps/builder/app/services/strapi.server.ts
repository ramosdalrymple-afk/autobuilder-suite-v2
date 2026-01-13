/**
 * Strapi CMS Client Service
 * 
 * This service provides integration with the Strapi CMS for:
 * - Fetching dynamic content (articles, products, team members, etc.)
 * - Managing template metadata
 * - Providing data for Webstudio Resources feature
 */

import env from "~/env/env.server";

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiItem {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface StrapiImage {
  id: number;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
  formats?: {
    thumbnail?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
  };
}

// Content Type Interfaces
export interface Article extends StrapiItem {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featuredImage?: StrapiImage;
  category?: string;
  author?: string;
}

export interface Product extends StrapiItem {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice?: number | null;
  sku?: string | null;
  inStock: boolean;
  images?: StrapiImage[];
  category?: string;
}

export interface TeamMember extends StrapiItem {
  name: string;
  role: string;
  bio: string | null;
  photo?: StrapiImage;
  email?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
}

export interface Testimonial extends StrapiItem {
  quote: string;
  author: string;
  company?: string | null;
  rating?: number | null;
  avatar?: StrapiImage;
}

export interface FAQ extends StrapiItem {
  question: string;
  answer: string;
  category?: string | null;
  order?: number;
}

export interface Project extends StrapiItem {
  title: string;
  slug: string;
  description: string | null;
  client?: string | null;
  completedDate?: string | null;
  images?: StrapiImage[];
  category?: string | null;
  featured: boolean;
}

export interface Service extends StrapiItem {
  title: string;
  slug: string;
  description: string | null;
  features?: string | null; // JSON or markdown
  icon?: string | null;
  price?: number | null;
  priceUnit?: string | null;
}

// Template metadata for the template management system
export interface WebsiteTemplate extends StrapiItem {
  name: string;
  description: string | null;
  category: string;
  webstudioProjectId: string;
  thumbnail?: StrapiImage;
  previewUrl?: string | null;
  features?: string | null; // JSON array
  isPremium: boolean;
  order?: number;
}

// Strapi error type
export interface StrapiError {
  status: number;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Strapi API Client
 */
class StrapiClient {
  private baseUrl: string;
  private apiToken: string;

  constructor() {
    this.baseUrl = env.STRAPI_URL;
    this.apiToken = env.STRAPI_API_TOKEN;
  }

  /**
   * Make a request to the Strapi API
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add authorization if token is configured
    if (this.apiToken) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.apiToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        status: response.status,
        name: "StrapiError",
        message: response.statusText,
      }));
      const error = errorData as StrapiError;
      throw new Error(`Strapi API Error: ${error.message}`);
    }

    return response.json();
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    const flatten = (obj: Record<string, unknown>, prefix = ""): void => {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}[${key}]` : key;
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
          flatten(value as Record<string, unknown>, newKey);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === "object") {
              flatten(item as Record<string, unknown>, `${newKey}[${index}]`);
            } else {
              searchParams.append(`${newKey}[${index}]`, String(item));
            }
          });
        } else if (value !== undefined && value !== null) {
          searchParams.append(newKey, String(value));
        }
      }
    };

    flatten(params);
    return searchParams.toString();
  }

  /**
   * Get collection items with optional filters
   */
  async getCollection<T extends StrapiItem>(
    collection: string,
    options: {
      filters?: Record<string, unknown>;
      populate?: string | string[] | Record<string, unknown>;
      sort?: string | string[];
      pagination?: { page?: number; pageSize?: number };
      fields?: string[];
      status?: "draft" | "published";
    } = {}
  ): Promise<StrapiResponse<T[]>> {
    const params: Record<string, unknown> = {};

    if (options.filters) {
      params.filters = options.filters;
    }

    if (options.populate) {
      params.populate = options.populate;
    }

    if (options.sort) {
      params.sort = options.sort;
    }

    if (options.pagination) {
      params.pagination = options.pagination;
    }

    if (options.fields) {
      params.fields = options.fields;
    }

    if (options.status) {
      params.status = options.status;
    }

    const queryString = this.buildQueryString(params);
    const endpoint = `/${collection}${queryString ? `?${queryString}` : ""}`;

    return this.fetch<StrapiResponse<T[]>>(endpoint);
  }

  /**
   * Get a single item by document ID
   */
  async getOne<T extends StrapiItem>(
    collection: string,
    documentId: string,
    options: {
      populate?: string | string[] | Record<string, unknown>;
      fields?: string[];
    } = {}
  ): Promise<StrapiResponse<T>> {
    const params: Record<string, unknown> = {};

    if (options.populate) {
      params.populate = options.populate;
    }

    if (options.fields) {
      params.fields = options.fields;
    }

    const queryString = this.buildQueryString(params);
    const endpoint = `/${collection}/${documentId}${queryString ? `?${queryString}` : ""}`;

    return this.fetch<StrapiResponse<T>>(endpoint);
  }

  /**
   * Find item by slug
   */
  async findBySlug<T extends StrapiItem & { slug: string }>(
    collection: string,
    slug: string,
    options: {
      populate?: string | string[] | Record<string, unknown>;
    } = {}
  ): Promise<T | null> {
    const response = await this.getCollection<T>(collection, {
      filters: { slug: { $eq: slug } },
      populate: options.populate,
      pagination: { pageSize: 1 },
    });

    return response.data[0] || null;
  }

  // ============================================
  // Content Type Specific Methods
  // ============================================

  /**
   * Get all articles
   */
  async getArticles(options: {
    category?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<StrapiResponse<Article[]>> {
    return this.getCollection<Article>("articles", {
      filters: options.category ? { category: { $eq: options.category } } : undefined,
      populate: ["featuredImage"],
      sort: ["publishedAt:desc"],
      pagination: { page: options.page, pageSize: options.pageSize },
    });
  }

  /**
   * Get article by slug
   */
  async getArticleBySlug(slug: string): Promise<Article | null> {
    return this.findBySlug<Article>("articles", slug, {
      populate: ["featuredImage"],
    });
  }

  /**
   * Get all products
   */
  async getProducts(options: {
    category?: string;
    inStock?: boolean;
    page?: number;
    pageSize?: number;
  } = {}): Promise<StrapiResponse<Product[]>> {
    const filters: Record<string, unknown> = {};
    
    if (options.category) {
      filters.category = { $eq: options.category };
    }
    
    if (options.inStock !== undefined) {
      filters.inStock = { $eq: options.inStock };
    }

    return this.getCollection<Product>("products", {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      populate: ["images"],
      sort: ["createdAt:desc"],
      pagination: { page: options.page, pageSize: options.pageSize },
    });
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    return this.findBySlug<Product>("products", slug, {
      populate: ["images"],
    });
  }

  /**
   * Get all team members
   */
  async getTeamMembers(): Promise<StrapiResponse<TeamMember[]>> {
    return this.getCollection<TeamMember>("team-members", {
      populate: ["photo"],
      sort: ["order:asc", "name:asc"],
    });
  }

  /**
   * Get all testimonials
   */
  async getTestimonials(): Promise<StrapiResponse<Testimonial[]>> {
    return this.getCollection<Testimonial>("testimonials", {
      populate: ["avatar"],
      sort: ["createdAt:desc"],
    });
  }

  /**
   * Get all FAQs
   */
  async getFAQs(category?: string): Promise<StrapiResponse<FAQ[]>> {
    return this.getCollection<FAQ>("faqs", {
      filters: category ? { category: { $eq: category } } : undefined,
      sort: ["order:asc"],
    });
  }

  /**
   * Get all projects
   */
  async getProjects(options: {
    category?: string;
    featured?: boolean;
    page?: number;
    pageSize?: number;
  } = {}): Promise<StrapiResponse<Project[]>> {
    const filters: Record<string, unknown> = {};
    
    if (options.category) {
      filters.category = { $eq: options.category };
    }
    
    if (options.featured !== undefined) {
      filters.featured = { $eq: options.featured };
    }

    return this.getCollection<Project>("projects", {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      populate: ["images"],
      sort: ["completedDate:desc"],
      pagination: { page: options.page, pageSize: options.pageSize },
    });
  }

  /**
   * Get project by slug
   */
  async getProjectBySlug(slug: string): Promise<Project | null> {
    return this.findBySlug<Project>("projects", slug, {
      populate: ["images"],
    });
  }

  /**
   * Get all services
   */
  async getServices(): Promise<StrapiResponse<Service[]>> {
    return this.getCollection<Service>("services", {
      sort: ["order:asc", "title:asc"],
    });
  }

  /**
   * Get service by slug
   */
  async getServiceBySlug(slug: string): Promise<Service | null> {
    return this.findBySlug<Service>("services", slug);
  }

  // ============================================
  // Template Management
  // ============================================

  /**
   * Get all website templates
   */
  async getTemplates(options: {
    category?: string;
    isPremium?: boolean;
  } = {}): Promise<StrapiResponse<WebsiteTemplate[]>> {
    const filters: Record<string, unknown> = {};
    
    if (options.category) {
      filters.category = { $eq: options.category };
    }
    
    if (options.isPremium !== undefined) {
      filters.isPremium = { $eq: options.isPremium };
    }

    return this.getCollection<WebsiteTemplate>("website-templates", {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      populate: ["thumbnail"],
      sort: ["order:asc", "name:asc"],
    });
  }

  /**
   * Get template by Webstudio project ID
   */
  async getTemplateByProjectId(projectId: string): Promise<WebsiteTemplate | null> {
    const response = await this.getCollection<WebsiteTemplate>("website-templates", {
      filters: { webstudioProjectId: { $eq: projectId } },
      populate: ["thumbnail"],
      pagination: { pageSize: 1 },
    });

    return response.data[0] || null;
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get full URL for Strapi media
   */
  getMediaUrl(path: string): string {
    if (path.startsWith("http")) {
      return path;
    }
    return `${this.baseUrl}${path}`;
  }

  /**
   * Check if Strapi is configured and available
   * We check the admin endpoint or just ping the server
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try to reach Strapi - any response (even 404) means it's running
      await fetch(`${this.baseUrl}/admin/init`);
      // Even if we get 404 or other status, if we got a response, Strapi is running
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all available content types from Strapi
   * This uses the content-type-builder API to discover collections
   */
  async getContentTypes(): Promise<StrapiContentType[]> {
    try {
      // Strapi v5 content-type-builder API
      const url = `${this.baseUrl}/api/content-type-builder/content-types`;
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (this.apiToken) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${this.apiToken}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        // Fallback: try to get content types from info endpoint
        return this.getContentTypesFromInfo();
      }

      const result = await response.json() as { data?: RawContentType[] };
      
      // Filter to only API content types (exclude admin, upload, etc.)
      const apiTypes = (result.data || []).filter((ct: RawContentType) => 
        ct.uid?.startsWith("api::") && 
        ct.schema?.kind === "collectionType"
      );

      return apiTypes.map((ct: RawContentType): StrapiContentType => {
        const apiId = ct.apiID || ct.uid.split("::")[1]?.split(".")[0] || "unknown";
        return {
          uid: ct.uid,
          apiId,
          displayName: ct.schema?.displayName || ct.apiID || "Unknown",
          pluralName: ct.schema?.pluralName ?? ct.apiID ?? apiId,
          singularName: ct.schema?.singularName ?? ct.apiID ?? apiId,
          description: ct.schema?.description || "",
          attributes: ct.schema?.attributes || {},
        };
      });
    } catch (error) {
      console.error("Failed to get content types:", error);
      return this.getContentTypesFromInfo();
    }
  }

  /**
   * Fallback method to discover content types by querying known endpoints
   */
  private async getContentTypesFromInfo(): Promise<StrapiContentType[]> {
    // Return a minimal list based on what we know exists
    const knownCollections = [
      { apiId: "articles", displayName: "Articles", pluralName: "articles" },
      { apiId: "products", displayName: "Products", pluralName: "products" },
      { apiId: "team-members", displayName: "Team Members", pluralName: "team-members" },
      { apiId: "testimonials", displayName: "Testimonials", pluralName: "testimonials" },
      { apiId: "faqs", displayName: "FAQs", pluralName: "faqs" },
      { apiId: "projects", displayName: "Projects", pluralName: "projects" },
      { apiId: "services", displayName: "Services", pluralName: "services" },
      { apiId: "website-templates", displayName: "Website Templates", pluralName: "website-templates" },
    ];

    // Check which ones actually exist
    const validTypes: StrapiContentType[] = [];

    for (const collection of knownCollections) {
      try {
        const response = await fetch(
          `${this.baseUrl}/api/${collection.pluralName}?pagination[pageSize]=1`,
          {
            headers: this.apiToken
              ? { Authorization: `Bearer ${this.apiToken}` }
              : {},
          }
        );
        if (response.ok) {
          validTypes.push({
            uid: `api::${collection.apiId}.${collection.apiId}`,
            apiId: collection.apiId,
            displayName: collection.displayName,
            pluralName: collection.pluralName,
            singularName: collection.apiId.replace(/-/g, ""),
            description: "",
            attributes: {},
          });
        }
      } catch {
        // Collection doesn't exist, skip
      }
    }

    return validTypes;
  }

  /**
   * Discover all content types including newly created ones
   */
  async discoverContentTypes(): Promise<StrapiContentType[]> {
    try {
      // First try the content-type-builder API
      const types = await this.getContentTypes();
      if (types.length > 0) {
        return types;
      }

      // If that fails, try to probe common endpoints
      return this.getContentTypesFromInfo();
    } catch {
      return [];
    }
  }
}

// Content Type interface for discovery
export interface StrapiContentType {
  uid: string;
  apiId: string;
  displayName: string;
  pluralName: string;
  singularName: string;
  description: string;
  attributes: Record<string, unknown>;
}

// Raw content type from Strapi API
interface RawContentType {
  uid: string;
  apiID?: string;
  schema?: {
    kind?: string;
    displayName?: string;
    pluralName?: string;
    singularName?: string;
    description?: string;
    attributes?: Record<string, unknown>;
  };
}

// Export singleton instance
export const strapi = new StrapiClient();

// Export helper to get image URL with format
export function getStrapiImageUrl(
  image: StrapiImage | undefined,
  format: "thumbnail" | "small" | "medium" | "large" | "original" = "original"
): string | null {
  if (!image) {
    return null;
  }

  const baseUrl = env.STRAPI_URL;

  if (format === "original") {
    return image.url.startsWith("http") ? image.url : `${baseUrl}${image.url}`;
  }

  const formatUrl = image.formats?.[format]?.url;
  if (formatUrl) {
    return formatUrl.startsWith("http") ? formatUrl : `${baseUrl}${formatUrl}`;
  }

  // Fallback to original if format not available
  return image.url.startsWith("http") ? image.url : `${baseUrl}${image.url}`;
}
