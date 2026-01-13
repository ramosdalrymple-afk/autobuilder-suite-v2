/**
 * Strapi Seed Script - Portfolio Template Sample Data
 * 
 * This script seeds sample portfolio content into Strapi including:
 * - Portfolio projects
 * - Services
 * - Testimonials
 * - Team members
 * 
 * Usage:
 * 1. Make sure Strapi is running: cd cms && npm run develop
 * 2. Run this script: npx ts-node scripts/seed-portfolio.ts
 */

export {}; // Make this file a module

const strapiUrl = process.env.STRAPI_URL || "http://localhost:1337";

// ============================================================================
// SAMPLE PORTFOLIO PROJECTS
// ============================================================================

const sampleProjects = [
  {
    title: "Brand Identity for TechVenture",
    slug: "techventure-brand-identity",
    description: `
A complete brand identity project for TechVenture, a Silicon Valley startup focused on AI-powered productivity tools.

**Deliverables:**
- Logo design and variations
- Brand guidelines document
- Business card and stationery
- Social media templates
- Website design concepts

The project focused on creating a modern, trustworthy identity that appeals to both enterprise clients and individual users.
    `.trim(),
    client: "TechVenture Inc.",
    category: "Branding",
    featured: true,
    completedDate: "2025-10-15",
  },
  {
    title: "E-commerce Website Redesign",
    slug: "ecommerce-website-redesign",
    description: `
Complete redesign of an established e-commerce platform selling artisanal home goods.

**Scope:**
- User research and persona development
- Information architecture
- UI/UX design
- Responsive web design
- Checkout flow optimization

Results: 45% increase in conversion rate, 30% reduction in cart abandonment.
    `.trim(),
    client: "Artisan Home Co.",
    category: "Web Design",
    featured: true,
    completedDate: "2025-08-22",
  },
  {
    title: "Mobile App Design - FitTrack",
    slug: "fittrack-mobile-app",
    description: `
Designed the complete user experience for FitTrack, a fitness tracking mobile application.

**Features Designed:**
- Onboarding flow
- Workout tracking interface
- Progress analytics dashboard
- Social sharing features
- Gamification elements

The app launched with 4.8 stars on both App Store and Google Play.
    `.trim(),
    client: "FitTrack Health",
    category: "Mobile App",
    featured: true,
    completedDate: "2025-06-10",
  },
  {
    title: "Marketing Campaign - GreenLeaf",
    slug: "greenleaf-marketing-campaign",
    description: `
Designed marketing materials for GreenLeaf's sustainability campaign.

**Deliverables:**
- Digital ad creatives
- Print materials
- Email templates
- Social media content
- Landing page design

The campaign achieved 2.5x the expected engagement rate.
    `.trim(),
    client: "GreenLeaf Organics",
    category: "Marketing",
    featured: false,
    completedDate: "2025-04-05",
  },
  {
    title: "SaaS Dashboard Design",
    slug: "saas-dashboard-design",
    description: `
Designed an analytics dashboard for a B2B SaaS platform focused on supply chain management.

**Key Features:**
- Real-time data visualization
- Customizable widgets
- Role-based access design
- Dark/light mode
- Export and reporting features

The redesign reduced user training time by 60%.
    `.trim(),
    client: "LogiFlow Systems",
    category: "Product Design",
    featured: false,
    completedDate: "2025-02-18",
  },
  {
    title: "Restaurant Brand & Menu Design",
    slug: "restaurant-brand-design",
    description: `
Complete brand identity and collateral design for an upscale farm-to-table restaurant.

**Deliverables:**
- Logo and brand identity
- Menu design (print & digital)
- Interior signage concepts
- Website design
- Reservation system UX

Helped the restaurant become one of the top-rated dining destinations in the city.
    `.trim(),
    client: "The Garden Table",
    category: "Branding",
    featured: false,
    completedDate: "2025-01-30",
  },
];

// ============================================================================
// SAMPLE SERVICES
// ============================================================================

const sampleServices = [
  {
    title: "Brand Identity Design",
    slug: "brand-identity-design",
    description: `
Create a unique visual identity that tells your brand's story.

Includes logo design, color palette, typography selection, and comprehensive brand guidelines.
    `.trim(),
    icon: "🎨",
    price: 3500,
    priceUnit: "starting at",
    features: ["Logo Design", "Brand Guidelines", "Color Palette", "Typography"],
    order: 1,
  },
  {
    title: "Web Design & Development",
    slug: "web-design-development",
    description: `
Custom website design that converts visitors into customers.

Responsive design, SEO optimization, and CMS integration included.
    `.trim(),
    icon: "💻",
    price: 5000,
    priceUnit: "starting at",
    features: ["Responsive Design", "SEO Optimization", "CMS Integration", "Analytics Setup"],
    order: 2,
  },
  {
    title: "UI/UX Design",
    slug: "ui-ux-design",
    description: `
User-centered design that delights your customers and drives engagement.

From user research to high-fidelity prototypes.
    `.trim(),
    icon: "✨",
    price: 4000,
    priceUnit: "starting at",
    features: ["User Research", "Wireframing", "Prototyping", "Usability Testing"],
    order: 3,
  },
  {
    title: "Mobile App Design",
    slug: "mobile-app-design",
    description: `
Beautiful, intuitive mobile experiences for iOS and Android.

End-to-end design from concept to developer handoff.
    `.trim(),
    icon: "📱",
    price: 6000,
    priceUnit: "starting at",
    features: ["iOS & Android", "Interaction Design", "Design System", "Developer Handoff"],
    order: 4,
  },
];

// ============================================================================
// SAMPLE TESTIMONIALS
// ============================================================================

const sampleTestimonials = [
  {
    name: "Sarah Chen",
    company: "TechVenture Inc.",
    role: "CEO",
    content: "Working with this team was an absolute pleasure. They understood our vision immediately and delivered a brand identity that perfectly captures who we are. Our new brand has significantly elevated our market presence.",
    rating: 5,
    featured: true,
    order: 1,
  },
  {
    name: "Marcus Johnson",
    company: "Artisan Home Co.",
    role: "Marketing Director",
    content: "The website redesign exceeded all our expectations. Our conversion rate jumped 45% within the first month. The attention to detail and user experience expertise was remarkable.",
    rating: 5,
    featured: true,
    order: 2,
  },
  {
    name: "Emily Rodriguez",
    company: "FitTrack Health",
    role: "Product Manager",
    content: "The app design process was collaborative and efficient. They took our complex requirements and created an intuitive interface that our users love. The 4.8-star rating speaks for itself!",
    rating: 5,
    featured: true,
    order: 3,
  },
  {
    name: "David Park",
    company: "LogiFlow Systems",
    role: "CTO",
    content: "The dashboard redesign transformed how our clients interact with our platform. Training time dropped by 60% and user satisfaction scores are at an all-time high.",
    rating: 5,
    featured: false,
    order: 4,
  },
];

// ============================================================================
// SAMPLE TEAM MEMBERS (for the "About Me" or "Team" section)
// ============================================================================

const sampleTeamMembers = [
  {
    name: "Alex Rivera",
    role: "Founder & Creative Director",
    bio: `
Award-winning designer with 10+ years of experience crafting digital experiences for startups and Fortune 500 companies.

Specializing in brand strategy, UI/UX design, and creative direction. Previously led design teams at Spotify and Airbnb.

When not designing, you'll find me hiking, photographing landscapes, or teaching design workshops.
    `.trim(),
    email: "alex@portfolio.design",
    linkedin: "https://linkedin.com/in/alexrivera",
    twitter: "https://twitter.com/alexrivera",
    order: 1,
  },
  {
    name: "Jordan Kim",
    role: "Senior UX Designer",
    bio: `
Human-centered design advocate with expertise in user research and interaction design.

Background in cognitive psychology with a passion for accessible design. Previously at Google and Microsoft.
    `.trim(),
    email: "jordan@portfolio.design",
    linkedin: "https://linkedin.com/in/jordankim",
    order: 2,
  },
  {
    name: "Sam Taylor",
    role: "Visual Designer",
    bio: `
Visual storyteller specializing in brand identity and illustration.

Creates memorable visual experiences that connect brands with their audiences. BFA from Rhode Island School of Design.
    `.trim(),
    email: "sam@portfolio.design",
    linkedin: "https://linkedin.com/in/samtaylor",
    order: 3,
  },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

interface StrapiResponse {
  data: {
    id: number;
    documentId: string;
  } | Array<{ id: number }>;
}

async function seedCollection(
  collectionName: string,
  items: any[],
  uniqueField: string
) {
  console.log(`\n📦 Seeding ${collectionName}...`);
  
  for (const item of items) {
    try {
      // Check if item already exists
      const checkResponse = await fetch(
        `${strapiUrl}/api/${collectionName}?filters[${uniqueField}][$eq]=${encodeURIComponent(item[uniqueField])}`
      );
      const checkData = await checkResponse.json() as StrapiResponse;

      if (Array.isArray(checkData.data) && checkData.data.length > 0) {
        console.log(`   ⏭️  Skipping "${item[uniqueField]}" - already exists`);
        continue;
      }

      // Create item
      const response = await fetch(`${strapiUrl}/api/${collectionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: item,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`   ❌ Failed to create "${item[uniqueField]}":`, error);
        continue;
      }

      const result = await response.json() as StrapiResponse;
      const createdData = result.data as { id: number; documentId: string };
      console.log(`   ✅ Created: ${item[uniqueField]} (ID: ${createdData.id})`);

      // Publish the item
      await fetch(
        `${strapiUrl}/api/${collectionName}/${createdData.documentId}/actions/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error(`   ❌ Error with "${item[uniqueField]}":`, error);
    }
  }
}

async function main() {
  console.log("🎨 Portfolio Template - Sample Data Seeder\n");
  console.log("━".repeat(50));
  console.log(`Strapi URL: ${strapiUrl}`);
  console.log("━".repeat(50));

  // Seed all collections
  await seedCollection("projects", sampleProjects, "slug");
  await seedCollection("services", sampleServices, "slug");
  await seedCollection("testimonials", sampleTestimonials, "name");
  await seedCollection("team-members", sampleTeamMembers, "name");

  console.log("\n" + "━".repeat(50));
  console.log("✨ Portfolio sample data seeding complete!");
  console.log("━".repeat(50));
  console.log("\n📝 Next steps:");
  console.log("   1. Visit http://localhost:1337/admin to review the content");
  console.log("   2. Upload images for projects and team members");
  console.log("   3. Create the Portfolio template in Webstudio");
  console.log("   4. Bind components to these Strapi collections\n");
}

main().catch(console.error);
