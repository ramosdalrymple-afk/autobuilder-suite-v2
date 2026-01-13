/**
 * Strapi Seed Script - Website Templates
 * 
 * This script seeds sample website templates into Strapi.
 * 
 * Usage:
 * 1. Make sure Strapi is running: cd cms && npm run develop
 * 2. Run this script: npx ts-node scripts/seed-templates.ts
 * 
 * Or manually add templates via Strapi Admin:
 * http://localhost:1337/admin → Content Manager → Website Template
 */

export {}; // Make this file a module

const strapiUrl = process.env.STRAPI_URL || "http://localhost:1337";

interface StrapiResponse {
  data: {
    id: number;
    documentId: string;
  } | Array<{ id: number }>;
}

// Sample templates to seed (these reference Webstudio project IDs from your .env)
const sampleTemplates = [
  {
    name: "Business Starter",
    description: "Professional business template with hero, services, testimonials, and contact sections. Perfect for small businesses and startups.",
    category: "business",
    webstudioProjectId: "532aece2-73fb-4af9-94b8-ae635f904454", // From your .env PROJECT_TEMPLATES
    previewUrl: null,
    features: ["Responsive", "Contact Form", "Testimonials", "Services Grid"],
    isPremium: false,
    order: 1,
  },
  {
    name: "Portfolio Pro",
    description: "Stunning portfolio template for creatives. Showcase your work with beautiful galleries and project details.",
    category: "portfolio",
    webstudioProjectId: "6acbbc51-1bc0-498e-a2f8-af2976aedfef", // From your .env PROJECT_TEMPLATES
    previewUrl: null,
    features: ["Project Gallery", "About Section", "Dark Mode", "Animations"],
    isPremium: false,
    order: 2,
  },
];

async function seedTemplates() {
  console.log("🌱 Seeding website templates...\n");

  for (const template of sampleTemplates) {
    try {
      // Check if template already exists
      const checkResponse = await fetch(
        `${strapiUrl}/api/website-templates?filters[webstudioProjectId][$eq]=${template.webstudioProjectId}`
      );
      const checkData = await checkResponse.json() as StrapiResponse;

      if (Array.isArray(checkData.data) && checkData.data.length > 0) {
        console.log(`⏭️  Skipping "${template.name}" - already exists`);
        continue;
      }

      // Create template
      const response = await fetch(`${strapiUrl}/api/website-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: template,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ Failed to create "${template.name}":`, error);
        continue;
      }

      const result = await response.json() as StrapiResponse;
      const createdData = result.data as { id: number; documentId: string };
      console.log(`✅ Created: ${template.name} (ID: ${createdData.id})`);
      
      // Publish the template
      const publishResponse = await fetch(
        `${strapiUrl}/api/website-templates/${createdData.documentId}/actions/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (publishResponse.ok) {
        console.log(`   📢 Published: ${template.name}`);
      }
    } catch (error) {
      console.error(`❌ Error with "${template.name}":`, error);
    }
  }

  console.log("\n✨ Seeding complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Open Strapi Admin: http://localhost:1337/admin");
  console.log("2. Go to Content Manager → Website Template");
  console.log("3. Add thumbnail images to your templates");
  console.log("4. Publish any draft templates");
}

// Run seeder
seedTemplates().catch(console.error);
