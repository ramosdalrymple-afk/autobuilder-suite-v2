import { lazy } from "react";
import { preconnect, prefetchDNS } from "react-dom";
import {
  Outlet,
  redirect,
  type ShouldRevalidateFunction,
} from "react-router-dom";
import { useLoaderData, type MetaFunction } from "@remix-run/react";
import { type LoaderFunctionArgs } from "@remix-run/server-runtime";
import {
  createCallerFactory,
  AuthorizationError,
  type AppContext,
} from "@webstudio-is/trpc-interface/index.server";
import { db as authDb } from "@webstudio-is/authorization-token/index.server";
import * as projectApi from "@webstudio-is/project/index.server";
import { parseBuilderUrl } from "@webstudio-is/http-client";
import { dashboardProjectRouter } from "@webstudio-is/dashboard/index.server";
import { builderUrl, isDashboard, loginPath } from "~/shared/router-utils";
import env from "~/env/env.server";
import { ClientOnly } from "~/shared/client-only";
import { preventCrossOriginCookie } from "~/services/no-cross-origin-cookie";
import { allowedDestinations } from "~/services/destinations.server";
export { ErrorBoundary } from "~/shared/error/error-boundary";
import { findAuthenticatedUser } from "~/services/auth.server";
import { createContext } from "~/shared/context.server";
import { strapi as strapiClient, type WebsiteTemplate } from "~/services/strapi.server";

// Strapi template metadata to be merged with Webstudio project data
export interface StrapiTemplateMeta {
  description: string | null;
  category: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  features: string[];
  isPremium: boolean;
  order: number;
  isExternal: boolean; // True if template is hosted externally (not in local DB)
}

// Extended template type with Strapi metadata
export interface EnrichedTemplate {
  id: string;
  title: string;
  previewImageAsset: {
    name: string;
  } | null;
  strapiMeta: StrapiTemplateMeta | null;
  isExternal: boolean; // True if template exists only in Strapi (not in local DB)
}

export const meta = () => {
  const metas: ReturnType<MetaFunction> = [];

  metas.push({ title: "Autobuilder Suite | Projects" });

  return metas;
};

/**
 * When deleting/adding a project, then navigating to a new project and pressing the back button,
 * the dashboard page may display stale data because it’s being retrieved from the browser’s back/forward cache (bfcache).
 *
 * https://web.dev/articles/bfcache
 *
 */
export const headers = () => {
  return {
    "Cache-Control": "no-store",
  };
};

const dashboardProjectCaller = createCallerFactory(dashboardProjectRouter);

const loadDashboardData = async (request: Request) => {
  if (false === isDashboard(request)) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  const user = await findAuthenticatedUser(request);

  const url = new URL(request.url);

  if (user === null) {
    throw redirect(
      loginPath({
        returnTo: `${url.pathname}${url.search}`,
      })
    );
  }

  const context = await createContext(request);

  if (context.authorization.type !== "user") {
    throw new AuthorizationError("You must be logged in to access this page");
  }

  const { userPlanFeatures } = context;

  if (userPlanFeatures === undefined) {
    throw new Response("User plan features are not defined", {
      status: 404,
    });
  }

  const { sourceOrigin } = parseBuilderUrl(request.url);

  const projects = await dashboardProjectCaller(context).findMany({
    userId: user.id,
  });

  // Fetch templates from Strapi CMS (with fallback to env)
  let strapiTemplates: WebsiteTemplate[] = [];
  let templateProjectIds: string[] = [];
  
  try {
    const strapiAvailable = await strapiClient.isAvailable();
    
    if (strapiAvailable) {
      const strapiResponse = await strapiClient.getTemplates();
      strapiTemplates = strapiResponse.data || [];
      templateProjectIds = strapiTemplates.map((t) => t.webstudioProjectId).filter(Boolean);
      console.log(`[Dashboard] Loaded ${strapiTemplates.length} templates from Strapi`);
    }
  } catch (error) {
    console.error("[Dashboard] Failed to fetch from Strapi:", error);
  }
  
  // Fallback to env-based templates if Strapi returned nothing
  if (templateProjectIds.length === 0 && env.PROJECT_TEMPLATES.length > 0) {
    console.log("[Dashboard] Falling back to env-based templates");
    templateProjectIds = env.PROJECT_TEMPLATES;
  }

  // Fetch the actual project data from Webstudio database for LOCAL templates
  const localTemplates = await dashboardProjectCaller(context).findManyByIds({
    projectIds: templateProjectIds,
  });
  
  // Create a set of found local project IDs
  const localProjectIds = new Set(localTemplates.map((t) => t.id));
  
  // Helper function to build Strapi metadata
  const buildStrapiMeta = (strapiData: WebsiteTemplate, isExternal: boolean): StrapiTemplateMeta => {
    let thumbnailUrl: string | undefined;
    if (strapiData.thumbnail) {
      const thumbnail = strapiData.thumbnail;
      thumbnailUrl = thumbnail.formats?.medium?.url ||
        thumbnail.formats?.small?.url ||
        thumbnail.url;
      // Make absolute if relative
      if (thumbnailUrl && !thumbnailUrl.startsWith("http")) {
        thumbnailUrl = `${env.STRAPI_URL || "http://localhost:1337"}${thumbnailUrl}`;
      }
    }
    
    return {
      description: strapiData.description || null,
      category: strapiData.category || "other",
      thumbnailUrl,
      previewUrl: strapiData.previewUrl || undefined,
      features: Array.isArray(strapiData.features) ? strapiData.features : [],
      isPremium: strapiData.isPremium || false,
      order: strapiData.order || 0,
      isExternal,
    };
  };

  // Build enriched templates from LOCAL projects (found in DB)
  const localEnrichedTemplates: EnrichedTemplate[] = localTemplates.map((project) => {
    const strapiData = strapiTemplates.find(
      (t) => t.webstudioProjectId === project.id
    );
    
    return {
      id: project.id,
      title: project.title,
      previewImageAsset: project.previewImageAsset || null,
      strapiMeta: strapiData ? buildStrapiMeta(strapiData, false) : null,
      isExternal: false,
    };
  });
  
  // Build enriched templates from EXTERNAL Strapi entries (not found in local DB)
  const externalEnrichedTemplates: EnrichedTemplate[] = strapiTemplates
    .filter((t) => t.webstudioProjectId && !localProjectIds.has(t.webstudioProjectId))
    .map((strapiData) => ({
      id: strapiData.webstudioProjectId, // Use Strapi's stored project ID
      title: strapiData.name, // Use Strapi name since we don't have local data
      previewImageAsset: null,
      strapiMeta: buildStrapiMeta(strapiData, true),
      isExternal: true, // Mark as external - cannot be cloned via local DB
    }));
  
  console.log(`[Dashboard] Found ${localEnrichedTemplates.length} local, ${externalEnrichedTemplates.length} external templates`);
  
  // Combine local and external templates
  const enrichedTemplates: EnrichedTemplate[] = [
    ...localEnrichedTemplates,
    ...externalEnrichedTemplates,
  ];

  // Sort by Strapi order, then by title
  enrichedTemplates.sort((a, b) => {
    const orderA = a.strapiMeta?.order ?? 999;
    const orderB = b.strapiMeta?.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });

  return {
    context,
    user,
    origin: sourceOrigin,
    userPlanFeatures,
    projects,
    templates: enrichedTemplates,
  };
};

const getProjectToClone = async (request: Request, context: AppContext) => {
  const url = new URL(request.url);
  const projectToCloneAuthToken = url.searchParams.get(
    "projectToCloneAuthToken"
  );

  if (
    // Only on navigation requests
    request.headers.get("sec-fetch-mode") !== "navigate" ||
    projectToCloneAuthToken === null
  ) {
    return;
  }

  // Clone project
  const token = await authDb.getTokenInfo(projectToCloneAuthToken, context);
  if (token.canClone === false) {
    throw new AuthorizationError("You don't have access to clone this project");
  }

  const project = await projectApi.loadById(
    token.projectId,
    await context.createTokenContext(projectToCloneAuthToken)
  );

  return {
    id: token.projectId,
    authToken: projectToCloneAuthToken,
    title: project.title,
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // CSRF token checks are not necessary for dashboard-only pages.
  // All requests from the builder or canvas app are safeguarded either by preventCrossOriginCookie for fetch requests
  // or by allowedDestinations for iframe requests.
  preventCrossOriginCookie(request);
  allowedDestinations(request, ["document", "empty"]);

  const { context, user, userPlanFeatures, origin, projects, templates } =
    await loadDashboardData(request);

  const projectToClone = await getProjectToClone(request, context);

  return {
    user,
    projects,
    templates,
    userPlanFeatures,
    publisherHost: env.PUBLISHER_HOST,
    origin,
    projectToClone,
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = ({
  defaultShouldRevalidate,
  currentUrl,
  nextUrl,
}) => {
  // We have the entire data on the client, so we don't need to revalidate when
  // URL is changing.
  if (currentUrl.href !== nextUrl.href) {
    return false;
  }
  // When .revalidate() was called explicitely without chaning the URL,
  // `defaultShouldRevalidate` will be true
  return defaultShouldRevalidate;
};

const DashboardSetup = lazy(async () => {
  const { DashboardSetup } = await import("~/dashboard/index.client");
  return { default: DashboardSetup };
});

const DashboardRoute = () => {
  const data = useLoaderData<typeof loader>();

  data.projects.slice(0, 5).forEach((project) => {
    prefetchDNS(builderUrl({ projectId: project.id, origin: data.origin }));
  });
  data.projects.slice(0, 5).forEach((project) => {
    preconnect(builderUrl({ projectId: project.id, origin: data.origin }));
  });

  return (
    <ClientOnly>
      <DashboardSetup data={data} />
      <Outlet />
    </ClientOnly>
  );
};

export default DashboardRoute;
