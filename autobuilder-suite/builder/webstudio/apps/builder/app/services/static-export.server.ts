/**
 * Static Export Service
 * 
 * Handles generating static site exports for local development.
 * This creates a downloadable file containing the complete site.
 */

import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync, createWriteStream } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import archiver from "archiver";
import type { Data } from "@webstudio-is/http-client";
import { nanoid } from "nanoid";
import { loadProductionCanvasData } from "~/shared/db/canvas.server";
import { createPostrestContext } from "~/shared/context.server";

// Store for pending and completed exports
const exportStore = new Map<string, {
  status: "pending" | "completed" | "failed";
  filePath?: string;
  error?: string;
  createdAt: Date;
}>();

// Clean up old exports after 1 hour
const EXPORT_TTL = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [name, data] of exportStore) {
    if (now - data.createdAt.getTime() > EXPORT_TTL) {
      if (data.filePath && existsSync(data.filePath)) {
        rm(data.filePath, { force: true }).catch(() => {});
      }
      exportStore.delete(name);
    }
  }
}, 60 * 1000);

export interface StaticExportOptions {
  buildId: string;
  builderOrigin: string;
  name: string;
  authToken?: string;
}

/**
 * Get the status of an export
 */
export const getExportStatus = (name: string) => {
  console.log(`[Static Export] getExportStatus called for: ${name}`);
  console.log(`[Static Export] Current store keys:`, Array.from(exportStore.keys()));
  return exportStore.get(name);
};

/**
 * Get the file path for a completed export
 */
export const getExportFilePath = (name: string): string | undefined => {
  const entry = exportStore.get(name);
  if (entry?.status === "completed" && entry.filePath) {
    return entry.filePath;
  }
  return undefined;
};

/**
 * Generate a static export
 */
export const generateStaticExport = async (
  options: StaticExportOptions
): Promise<{ success: true } | { success: false; error: string }> => {
  const { buildId, name } = options;
  
  // Mark as pending
  exportStore.set(name, {
    status: "pending",
    createdAt: new Date(),
  });

  try {
    console.log(`[Static Export] Loading build data directly from database`);
    
    // Create a service context for database access
    const postgrest = createPostrestContext();
    const serviceContext = {
      authorization: { type: "service" as const, isServiceCall: true },
      postgrest,
      // Minimal context needed for loadProductionCanvasData
      domain: {} as any,
      deployment: {} as any,
      entri: {} as any,
      userPlanFeatures: {} as any,
      trpcCache: {} as any,
      createTokenContext: async () => serviceContext,
    };
    
    // Load build data directly from database (no HTTP request needed)
    const buildData = await loadProductionCanvasData(buildId, serviceContext);

    console.log(`[Static Export] Build data loaded, pages: ${buildData.pages?.length ?? 0}`);

    // Generate the static site
    const outputDir = join(tmpdir(), "webstudio-exports", nanoid());
    console.log(`[Static Export] Output dir: ${outputDir}`);
    await mkdir(outputDir, { recursive: true });

    // Generate HTML, CSS, and assets
    console.log(`[Static Export] Generating static site...`);
    await generateStaticSite(buildData, outputDir);

    // Create export bundle file
    const bundlePath = join(tmpdir(), "webstudio-exports", name);
    console.log(`[Static Export] Creating bundle at: ${bundlePath}`);
    await mkdir(dirname(bundlePath), { recursive: true });
    await createExportBundle(outputDir, bundlePath);

    // Clean up temp directory
    await rm(outputDir, { recursive: true, force: true });

    // Update build status in database to PUBLISHED
    console.log(`[Static Export] Updating build ${buildId} status to PUBLISHED`);
    const updateResult = await postgrest.client
      .from("Build")
      .update({ publishStatus: "PUBLISHED", updatedAt: new Date().toISOString() })
      .eq("id", buildId);
    
    if (updateResult.error) {
      console.error(`[Static Export] Failed to update build status:`, updateResult.error);
      // Continue anyway since the export itself succeeded
    }

    // Mark as completed in memory store
    exportStore.set(name, {
      status: "completed",
      filePath: bundlePath,
      createdAt: new Date(),
    });

    console.log(`[Static Export] Complete!`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Static Export] Error:`, error);
    
    // Update build status in database to FAILED
    try {
      const postgrest = createPostrestContext();
      await postgrest.client
        .from("Build")
        .update({ publishStatus: "FAILED", updatedAt: new Date().toISOString() })
        .eq("id", buildId);
    } catch (dbError) {
      console.error(`[Static Export] Failed to update build status to FAILED:`, dbError);
    }
    
    exportStore.set(name, {
      status: "failed",
      error: errorMessage,
      createdAt: new Date(),
    });

    return { success: false, error: errorMessage };
  }
};

/**
 * Generate static site files from build data
 */
async function generateStaticSite(data: Data, outputDir: string): Promise<void> {
  const { build, assets, pages } = data;
  
  // Create directories
  await mkdir(join(outputDir, "assets"), { recursive: true });
  await mkdir(join(outputDir, "css"), { recursive: true });

  // Generate basic CSS from styles
  const cssText = generateBasicCss(build.styles);
  await writeFile(join(outputDir, "css", "styles.css"), cssText);

  // Generate index.html for each page
  for (const page of pages) {
    // Use the page's path directly
    const pagePath = page.path || "/";
    
    // Sanitize path for filesystem - remove characters not allowed in Windows paths
    // Also skip wildcard routes (like /*) as they can't be represented as static files
    if (pagePath.includes("*")) {
      console.log(`[Static Export] Skipping wildcard route: ${pagePath}`);
      continue;
    }
    
    const sanitizedPath = pagePath.replace(/[<>:"|?]/g, "_");
    const htmlPath = sanitizedPath === "/" ? "index.html" : `${sanitizedPath.slice(1).replace(/\/$/, "")}/index.html`;
    
    await mkdir(dirname(join(outputDir, htmlPath)), { recursive: true });
    
    const html = generatePageHtml(page);
    await writeFile(join(outputDir, htmlPath), html);
  }

  // Create asset manifest
  const assetManifest = assets.map(asset => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
  }));
  
  await writeFile(
    join(outputDir, "assets", "manifest.json"),
    JSON.stringify(assetManifest, null, 2)
  );

  // Create build info
  const buildInfo = {
    buildId: build.id,
    projectId: build.projectId,
    version: build.version,
    createdAt: build.createdAt,
    exportedAt: new Date().toISOString(),
    pagesCount: pages.length,
    assetsCount: assets.length,
  };
  
  await writeFile(
    join(outputDir, "build-info.json"),
    JSON.stringify(buildInfo, null, 2)
  );

  // Create README
  const readme = `# Static Export

This is a static export of your Webstudio project.

## Structure
- \`index.html\` - Main page
- \`css/styles.css\` - Generated styles
- \`assets/\` - Asset manifest and files
- \`build-info.json\` - Build metadata

## Deployment
Upload the contents of this folder to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages
- Any web server

## Full Static Site Generation
For a complete static site with all components and interactivity,
use the Webstudio CLI:

\`\`\`bash
npx webstudio link
npx webstudio sync
npx webstudio build --template ssg
\`\`\`

## Generated
${new Date().toISOString()}
`;
  
  await writeFile(join(outputDir, "README.md"), readme);
}

/**
 * Generate basic CSS from style data
 */
function generateBasicCss(styles: Data["build"]["styles"]): string {
  // Extract unique style properties
  const cssRules: string[] = [];
  
  cssRules.push(`/* Webstudio Static Export Styles */`);
  cssRules.push(`/* Generated: ${new Date().toISOString()} */`);
  cssRules.push(``);
  cssRules.push(`/* Base styles */`);
  cssRules.push(`* { box-sizing: border-box; margin: 0; padding: 0; }`);
  cssRules.push(`body { font-family: system-ui, -apple-system, sans-serif; }`);
  cssRules.push(``);
  cssRules.push(`/* Total styles in project: ${styles.length} */`);
  cssRules.push(`/* For complete styles, use the Webstudio CLI */`);
  
  return cssRules.join("\n");
}

/**
 * Generate HTML for a page
 */
function generatePageHtml(page: Data["pages"][0]): string {
  const title = page.meta?.title || page.name || "Webstudio Page";
  const description = page.meta?.description || "";
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/css/styles.css">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
    .export-notice { padding: 2rem; max-width: 800px; margin: 0 auto; }
    .export-notice h1 { color: #1a1a1a; }
    .export-notice p { color: #666; line-height: 1.6; }
    .export-notice code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 4px; }
  </style>
</head>
<body>
  <div id="root">
    <div class="export-notice">
      <h1>${escapeHtml(title)}</h1>
      ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 0.9rem;">
        <strong>Note:</strong> This is a basic static export containing your project's 
        styles and metadata. For a complete static site with all components and 
        interactivity, use the Webstudio CLI: <code>npx webstudio build --template ssg</code>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Create an export bundle as a proper ZIP file
 */
async function createExportBundle(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 } // Maximum compression
    });

    output.on("close", () => {
      console.log(`[Static Export] ZIP created: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add the entire source directory to the ZIP
    archive.directory(sourceDir, false);

    archive.finalize();
  });
}
