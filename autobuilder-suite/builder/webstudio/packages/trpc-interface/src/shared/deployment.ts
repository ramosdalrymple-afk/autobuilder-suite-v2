import { z } from "zod";
import { router, procedure } from "./trpc";

// Has corresponding type in saas
export const PublishInput = z.object({
  // used to load build data from the builder see routes/rest.build.$buildId.ts
  buildId: z.string(),
  builderOrigin: z.string(),
  githubSha: z.string().optional(),

  destination: z.enum(["saas", "static"]),
  // preview support
  branchName: z.string(),
  // action log helper (not used for deployment, but for action logs readablity)
  logProjectName: z.string(),
  // For static exports: the filename for the export bundle
  exportName: z.string().optional(),
});

export const Output = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

/**
 * Handler type for static export implementation
 * This allows the builder app to inject its own implementation
 */
export type StaticExportHandler = (input: z.infer<typeof PublishInput>) => Promise<
  { success: true } | { success: false; error: string }
>;

/**
 * Global handler that can be set by the builder app
 * This is used for local development static export
 */
let staticExportHandler: StaticExportHandler | null = null;

/**
 * Register a static export handler
 * Called by the builder app to enable local static export
 */
export const setStaticExportHandler = (handler: StaticExportHandler) => {
  staticExportHandler = handler;
};

/**
 * This is the ContentManagementService. It is currently used to publish content to a custom domain.
 * In the future, additional methods, such as a 'preview' function, could be added.
 **/
export const deploymentRouter = router({
  publish: procedure
    .input(PublishInput)
    .output(Output)
    .mutation(async ({ input }) => {
      console.log("[deploymentRouter] publish called:", {
        destination: input.destination,
        buildId: input.buildId,
        hasHandler: staticExportHandler !== null,
      });

      // If we have a static export handler and the destination is static, use it
      if (input.destination === "static" && staticExportHandler !== null) {
        console.log("[deploymentRouter] Calling static export handler");
        return await staticExportHandler(input);
      }

      // For SaaS destination or when no handler is registered
      if (input.destination === "saas") {
        return {
          success: false,
          error: "SaaS publishing requires a deployment service. Configure TRPC_SERVER_URL and TRPC_SERVER_API_TOKEN in your .env file.",
        };
      }

      console.log("[deploymentRouter] No static export handler registered!");
      return {
        success: false,
        error: "Static export handler not registered. Please restart the development server.",
      };
    }),
});
