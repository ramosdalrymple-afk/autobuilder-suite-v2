import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Auto-configure public permissions for content types
    await configurePublicPermissions(strapi);
  },
};

/**
 * Configure public API permissions for content types
 * This runs on every Strapi startup to ensure permissions are set
 */
async function configurePublicPermissions(strapi: Core.Strapi) {
  // Content types to make publicly readable
  const publicContentTypes = [
    "api::article.article",
    "api::faq.faq",
    "api::footer.footer",
    "api::product.product",
    "api::project.project",
    "api::sample.sample",
    "api::service.service",
    "api::team-member.team-member",
    "api::testimonial.testimonial",
    "api::vehicle.vehicle",
    "api::website-template.website-template",
  ];

  // Plugin permissions (like media library)
  const pluginPermissions = [
    "plugin::upload.content-api.find",      // List all media files
    "plugin::upload.content-api.findOne",   // Get single media file
  ];

  try {
    // Get the public role
    const publicRole = await strapi
      .query("plugin::users-permissions.role")
      .findOne({
        where: { type: "public" },
      });

    if (!publicRole) {
      console.log("[Bootstrap] Public role not found, skipping permission setup");
      return;
    }

    // For each content type, ensure find and findOne permissions exist
    for (const contentType of publicContentTypes) {
      const actions = ["find", "findOne"];
      
      for (const action of actions) {
        const permissionAction = `${contentType}.${action}`;
        
        // Check if permission already exists
        const existingPermission = await strapi
          .query("plugin::users-permissions.permission")
          .findOne({
            where: {
              action: permissionAction,
              role: publicRole.id,
            },
          });

        if (!existingPermission) {
          // Create the permission
          await strapi.query("plugin::users-permissions.permission").create({
            data: {
              action: permissionAction,
              role: publicRole.id,
            },
          });
          console.log(`[Bootstrap] Created permission: ${permissionAction}`);
        }
      }
    }

    // Configure plugin permissions (media library)
    for (const permissionAction of pluginPermissions) {
      const existingPermission = await strapi
        .query("plugin::users-permissions.permission")
        .findOne({
          where: {
            action: permissionAction,
            role: publicRole.id,
          },
        });

      if (!existingPermission) {
        await strapi.query("plugin::users-permissions.permission").create({
          data: {
            action: permissionAction,
            role: publicRole.id,
          },
        });
        console.log(`[Bootstrap] Created permission: ${permissionAction}`);
      }
    }

    console.log("[Bootstrap] ✅ Public API permissions configured");
  } catch (error) {
    console.error("[Bootstrap] Error configuring permissions:", error);
  }
}
