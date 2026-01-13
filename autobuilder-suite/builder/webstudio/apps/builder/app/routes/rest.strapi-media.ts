/**
 * Strapi Media Library Endpoint
 * 
 * Fetches media files from Strapi's upload plugin and returns them
 * in a format compatible with Webstudio's asset system.
 */

import { type LoaderFunctionArgs } from "@remix-run/server-runtime";
import env from "~/env/env.server";

const STRAPI_URL = env.STRAPI_URL || "http://localhost:1337";

export interface StrapiMediaFile {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: {
    thumbnail?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
  } | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiMediaResponse {
  available: boolean;
  files: StrapiMediaFile[];
  count: number;
  error?: string;
}

/**
 * Make URLs absolute if they're relative
 */
function makeAbsoluteUrl(url: string): string {
  if (url.startsWith("http")) {
    return url;
  }
  return `${STRAPI_URL}${url}`;
}

/**
 * Transform Strapi media to include absolute URLs
 */
function transformMedia(file: StrapiMediaFile): StrapiMediaFile {
  return {
    ...file,
    url: makeAbsoluteUrl(file.url),
    previewUrl: file.previewUrl ? makeAbsoluteUrl(file.previewUrl) : null,
    formats: file.formats
      ? {
          thumbnail: file.formats.thumbnail
            ? { ...file.formats.thumbnail, url: makeAbsoluteUrl(file.formats.thumbnail.url) }
            : undefined,
          small: file.formats.small
            ? { ...file.formats.small, url: makeAbsoluteUrl(file.formats.small.url) }
            : undefined,
          medium: file.formats.medium
            ? { ...file.formats.medium, url: makeAbsoluteUrl(file.formats.medium.url) }
            : undefined,
          large: file.formats.large
            ? { ...file.formats.large, url: makeAbsoluteUrl(file.formats.large.url) }
            : undefined,
        }
      : null,
  };
}

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<Response> => {
  try {
    // Parse query params for filtering
    const url = new URL(request.url);
    const type = url.searchParams.get("type"); // image, video, file
    const page = url.searchParams.get("page") || "1";
    const pageSize = url.searchParams.get("pageSize") || "50";

    // Build Strapi API URL
    const apiUrl = new URL(`${STRAPI_URL}/api/upload/files`);
    apiUrl.searchParams.set("pagination[page]", page);
    apiUrl.searchParams.set("pagination[pageSize]", pageSize);
    apiUrl.searchParams.set("sort", "createdAt:desc");

    // Filter by mime type if specified
    if (type === "image") {
      apiUrl.searchParams.set("filters[mime][$startsWith]", "image/");
    } else if (type === "video") {
      apiUrl.searchParams.set("filters[mime][$startsWith]", "video/");
    }

    const response = await fetch(apiUrl.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Strapi might not be available or media endpoint not accessible
      if (response.status === 403) {
        return Response.json({
          available: false,
          files: [],
          count: 0,
          error: "Media library access not configured. Enable 'find' permission for Upload in Strapi admin.",
        } satisfies StrapiMediaResponse);
      }
      
      throw new Error(`Failed to fetch media: ${response.status}`);
    }

    const files: StrapiMediaFile[] = await response.json();
    
    // Transform URLs to be absolute
    const transformedFiles = files.map(transformMedia);

    return Response.json({
      available: true,
      files: transformedFiles,
      count: transformedFiles.length,
    } satisfies StrapiMediaResponse);
  } catch (error) {
    console.error("[Strapi Media] Error:", error);
    
    return Response.json({
      available: false,
      files: [],
      count: 0,
      error: error instanceof Error ? error.message : "Failed to fetch media",
    } satisfies StrapiMediaResponse);
  }
};
