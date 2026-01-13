/**
 * Static Export Download Route
 * 
 * Serves generated static export files for download.
 * Route: /cgi/static/ssg/{filename}
 */

import { type LoaderFunctionArgs } from "@remix-run/server-runtime";
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { getExportFilePath, getExportStatus } from "~/services/static-export.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  // Note: We don't check isDashboard here because static exports may be
  // triggered from external project URLs and need to download from the local builder
  
  const filename = params["*"];
  console.log(`[Static Download] Requested file: ${filename}`);
  
  if (!filename) {
    throw new Response("Filename required", { status: 400 });
  }

  // Check export status
  const status = getExportStatus(filename);
  console.log(`[Static Download] Export status:`, status);
  
  if (!status) {
    throw new Response("Export not found. The export may have expired or never started.", { status: 404 });
  }

  if (status.status === "pending") {
    throw new Response("Export still in progress. Please wait...", { status: 202 });
  }

  if (status.status === "failed") {
    throw new Response(`Export failed: ${status.error}`, { status: 500 });
  }

  // Get the file path
  const filePath = getExportFilePath(filename);
  
  if (!filePath || !existsSync(filePath)) {
    throw new Response("Export file not found on disk", { status: 404 });
  }

  // Read the file as binary (ZIP file)
  const content = await readFile(filePath);
  const fileStats = statSync(filePath);

  // Return the ZIP file as a download
  // Convert Buffer to Uint8Array for Response compatibility
  return new Response(new Uint8Array(content), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": fileStats.size.toString(),
      "Cache-Control": "private, no-cache",
    },
  });
};
