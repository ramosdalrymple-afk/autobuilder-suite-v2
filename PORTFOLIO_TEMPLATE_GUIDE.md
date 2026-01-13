# Portfolio Template Creation Guide

> Step-by-step guide to creating and publishing a Portfolio starter template.

## Overview

This guide walks you through creating a fully functional Portfolio template that users can clone from the dashboard. The template includes:

- **Live Preview** - Iframe preview before cloning
- **Auto-Clone** - One-click project creation
- **Sample Data** - Pre-seeded Strapi content
- **CMS Binding** - Ready-to-use data connections

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Dashboard                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Template Card                                           ││
│  │  ┌──────────────┐                                        ││
│  │  │  Thumbnail   │  [👁 Preview]  [Use Template]          ││
│  │  │              │                                        ││
│  │  │  🎨 Portfolio│                                        ││
│  │  └──────────────┘                                        ││
│  │  "Portfolio Pro"                                         ││
│  │  Showcase your creative work                             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  Webstudio  │ │   Strapi    │ │   Strapi    │
    │   Project   │ │  Template   │ │   Content   │
    │  (Source)   │ │  Metadata   │ │  (Sample)   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Step 1: Create the Webstudio Project

### 1.1 Create a New Project

1. Go to Dashboard → "Create New Project"
2. Name it: `Portfolio Template Source`
3. This project becomes your **template source**

### 1.2 Build the Portfolio Pages

Create these pages in Webstudio:

| Page | Path | Purpose |
|------|------|---------|
| Home | `/` | Hero, featured projects, services |
| Portfolio | `/portfolio` | Project gallery grid |
| Project Detail | `/portfolio/:slug` | Dynamic project page |
| About | `/about` | Bio, skills, team |
| Contact | `/contact` | Contact form |

### 1.3 Design the Home Page

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]                    Home  Portfolio  About  Contact │  ← Header
├────────────────────────────────────────────────────────────┤
│                                                            │
│              Hi, I'm Alex Rivera                           │
│              Creative Designer                             │
│                                                            │
│              [View My Work]  [Contact Me]                  │  ← Hero
│                                                            │
├────────────────────────────────────────────────────────────┤
│  Featured Projects                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Project1 │ │ Project2 │ │ Project3 │                    │  ← Collection
│  │          │ │          │ │          │                    │     (Bound to
│  │ Branding │ │ Web Design│ │ Mobile  │                    │      Strapi)
│  └──────────┘ └──────────┘ └──────────┘                    │
├────────────────────────────────────────────────────────────┤
│  Services                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 🎨 Branding  │ │ 💻 Web Design│ │ ✨ UI/UX     │        │  ← Collection
│  │ $3,500       │ │ $5,000       │ │ $4,000       │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
├────────────────────────────────────────────────────────────┤
│  What Clients Say                                           │
│  "Amazing work..." - Sarah Chen, CEO                        │  ← Testimonials
├────────────────────────────────────────────────────────────┤
│  [Logo]   Links   Social   © 2025                          │  ← Footer
└────────────────────────────────────────────────────────────┘
```

---

## Step 2: Bind Components to Strapi

### 2.1 Add Data Resources

In Webstudio Builder:
1. Open **Resources** panel
2. Connect to Strapi CMS
3. Add these collections:
   - `projects` - Portfolio work
   - `services` - Service offerings
   - `testimonials` - Client testimonials
   - `team-members` - About page

### 2.2 Bind Collection List

1. Add a **Collection** component
2. Set the data source to your Strapi resource
3. Design the item template
4. Bind fields:

```
Collection Item
├── Image → {project.images[0].url}
├── Title → {project.title}
├── Category → {project.category}
└── Link → /portfolio/{project.slug}
```

### 2.3 Dynamic Routes

For `/portfolio/:slug`:

1. Create page with `:slug` parameter
2. Add resource: `GET /rest/strapi/projects?filters[slug][$eq]={slug}`
3. Bind page content to first result

---

## Step 3: Seed Sample Content

### 3.1 Run the Seed Script

```bash
cd cms
npx ts-node scripts/seed-portfolio.ts
```

This creates:
- 6 sample portfolio projects
- 4 services
- 4 testimonials
- 3 team members

### 3.2 Upload Images

1. Go to Strapi Admin: http://localhost:1337/admin
2. Navigate to each project
3. Upload high-quality portfolio images
4. Recommended: 1600x1200px, WebP format

---

## Step 4: Register Template in Strapi

### 4.1 Get Webstudio Project ID

1. Open your template project in Webstudio
2. Copy the project ID from the URL:
   ```
   https://webstudio.is/dashboard/builder/{PROJECT_ID}
   ```

### 4.2 Create Template Entry

In Strapi Admin → Content Manager → Website Template:

```json
{
  "name": "Portfolio Pro",
  "description": "Stunning portfolio template for creatives. Showcase your work with beautiful galleries.",
  "category": "portfolio",
  "webstudioProjectId": "your-project-id-here",
  "previewUrl": "https://your-project-id.wstd.io",
  "features": [
    "Project Gallery",
    "Dynamic Project Pages",
    "Services Section",
    "Testimonials",
    "Contact Form",
    "Dark Mode Ready"
  ],
  "isPremium": false,
  "order": 1
}
```

### 4.3 Upload Thumbnail

- Create a 800x600px screenshot of your template
- Upload to the `thumbnail` field
- This appears in the dashboard template gallery

### 4.4 Publish

Click **Publish** to make the template available.

---

## Step 5: Test the Flow

### 5.1 Dashboard Preview

1. Go to Dashboard → Templates
2. Find your "Portfolio Pro" template
3. Hover to see **Preview** button

### 5.2 Live Preview

1. Click **Preview** or 👁 icon
2. Template opens in iframe modal
3. Test navigation and responsiveness
4. Click "Use This Template" to clone

### 5.3 Clone Test

1. Click "Use This Template"
2. Enter project name
3. Click "Clone"
4. Opens in Builder with all content bound

---

## Template Best Practices

### Design Guidelines

| Aspect | Recommendation |
|--------|----------------|
| **Layout** | Use CSS Grid for gallery, Flexbox for sections |
| **Typography** | 2-3 font families max, clear hierarchy |
| **Colors** | Define CSS variables for easy theming |
| **Spacing** | Consistent rhythm using design tokens |
| **Images** | Lazy loading, responsive srcset |

### Content Placeholders

Use descriptive placeholder content:
- ❌ "Lorem ipsum dolor sit amet"
- ✅ "Write a compelling headline about your creative work"

### Strapi Schema Tips

```
Project
├── title (string, required)
├── slug (uid, auto-generated)
├── description (richtext)
├── client (string)
├── category (string)
├── images (media, multiple)
├── featured (boolean)
└── completedDate (date)
```

---

## Troubleshooting

### Template Not Showing

1. Check Strapi template is **published**
2. Verify `webstudioProjectId` matches exactly
3. Ensure Strapi permissions allow public read

### Preview Not Loading

1. Template project must be published on wstd.io
2. Or set `previewUrl` to your custom domain
3. Check for X-Frame-Options headers

### Clone Fails

1. User must be logged in
2. Source project must exist in LOCAL database
3. Check browser console for errors

---

## External Templates

> **New Feature**: Templates can now be hosted on external Webstudio instances (like wstd.dev) and displayed in your dashboard!

### How External Templates Work

When you register a template in Strapi, the system automatically detects whether the project exists in your local database:

| Project Location | Behavior | User Action |
|-----------------|----------|-------------|
| **Local** | Direct clone | "Use This Template" button |
| **External** | Preview only | "Open in Webstudio" → opens external site |

### Registering an External Template

1. **Create your template** on webstudio.is or wstd.dev
2. **Get the project ID** from the URL:
   ```
   https://p-0f644cf7-8be6-4d43-a8aa-5cfd0a089fb4.wstd.dev
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                     This is the project ID
   ```

3. **Add to Strapi** with these required fields:
   ```json
   {
     "name": "My External Portfolio",
     "category": "portfolio",
     "webstudioProjectId": "0f644cf7-8be6-4d43-a8aa-5cfd0a089fb4",
     "previewUrl": "https://p-0f644cf7-8be6-4d43-a8aa-5cfd0a089fb4.vite.wstd.dev:5173",
     "description": "A beautiful portfolio created on Webstudio Cloud"
   }
   ```

4. **Publish** the template entry in Strapi

### External Template Badge

External templates display an "External" badge in the dashboard:

```
┌──────────────────────────┐
│  🔗 External             │ ← Blue badge
│                          │
│   [Template Preview]     │
│                          │
├──────────────────────────┤
│  "My External Portfolio" │
│  Opens in Webstudio →    │
└──────────────────────────┘
```

### Converting External to Local

To enable direct cloning of an external template:

1. **Export** from the external Webstudio (if supported)
2. **Import** into your local Webstudio instance
3. **Update Strapi** with the new local project ID
4. The template will now show "Use This Template" instead of "Open in Webstudio"

---

## Content Types for Portfolio

### Projects Collection

```
api/project
├── title: string (required)
├── slug: uid → title
├── description: richtext
├── client: string
├── category: string
├── images: media[]
├── featured: boolean
└── completedDate: date
```

### Services Collection

```
api/service
├── title: string (required)
├── slug: uid → title
├── description: richtext
├── icon: string (emoji)
├── price: decimal
├── priceUnit: string
├── features: json[]
└── order: integer
```

### Team Members Collection

```
api/team-member
├── name: string (required)
├── role: string (required)
├── bio: richtext
├── photo: media
├── email: email
├── linkedin: string
├── twitter: string
└── order: integer
```

---

## Quick Commands

```bash
# Start Strapi
cd cms && npm run develop

# Seed portfolio data
cd cms && npx ts-node scripts/seed-portfolio.ts

# Start Webstudio
cd autobuilder-suite/builder/webstudio && pnpm dev

# Build for production
cd autobuilder-suite/builder/webstudio && pnpm build
```

---

## Next Steps

1. **Create More Templates** - Business, SaaS, Blog
2. **Add Premium Templates** - Set `isPremium: true`
3. **Custom Categories** - Extend the schema
4. **Template Variations** - Dark/light versions
5. **Template Updates** - Notify users of improvements
