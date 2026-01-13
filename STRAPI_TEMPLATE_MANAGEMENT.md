# Template Management via Strapi

> A comprehensive guide for managing Webstudio starter templates through Strapi CMS.

---

## 📋 Overview

This document outlines how to use Strapi as a headless CMS to manage starter templates for the Autobuilder Suite. Instead of hardcoding template project IDs in environment variables, templates are managed through Strapi's admin panel.

### Benefits

| Current Approach (.env) | Strapi Approach |
|------------------------|-----------------|
| ❌ Requires server restart | ✅ Real-time updates |
| ❌ Developer-only access | ✅ Admin panel for anyone |
| ❌ No metadata (descriptions, images) | ✅ Rich metadata support |
| ❌ No categories or ordering | ✅ Categories, tags, ordering |
| ❌ Hard to scale | ✅ Scales easily |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      TEMPLATE FLOW                               │
└─────────────────────────────────────────────────────────────────┘

  Admin adds template          API fetches              User sees
  in Strapi panel             templates                templates
        │                         │                        │
        ▼                         ▼                        ▼
┌──────────────┐          ┌──────────────┐         ┌──────────────┐
│   Strapi     │  ──────► │  Webstudio   │ ──────► │  Dashboard   │
│   Admin      │   REST   │   Backend    │         │  Templates   │
│   Panel      │   API    │   Loader     │         │  Grid        │
└──────────────┘          └──────────────┘         └──────────────┘
      │                                                   │
      │                                                   │
      ▼                                                   ▼
┌──────────────┐                                  ┌──────────────┐
│  Template    │                                  │  Clone to    │
│  Content     │                                  │  User's      │
│  Type        │                                  │  Projects    │
└──────────────┘                                  └──────────────┘
```

---

## 📦 Part 1: Strapi Setup

### Step 1.1: Create the Template Content Type

In Strapi Admin Panel (`http://localhost:1337/admin`):

1. Go to **Content-Type Builder**
2. Click **Create new collection type**
3. Name it: `Template`
4. Add the following fields:

#### Required Fields

| Field Name | Type | Settings |
|------------|------|----------|
| `title` | Text (Short) | Required |
| `projectId` | Text (Short) | Required, Unique |
| `description` | Text (Long) | Optional |
| `thumbnail` | Media (Single) | Optional |
| `category` | Enumeration | Values: `business`, `portfolio`, `ecommerce`, `blog`, `landing` |
| `featured` | Boolean | Default: false |
| `order` | Number (Integer) | Default: 0 |
| `status` | Enumeration | Values: `draft`, `published`, `archived` |

#### Optional Fields (Advanced)

| Field Name | Type | Settings |
|------------|------|----------|
| `tags` | JSON | For flexible tagging |
| `pricing` | Enumeration | Values: `free`, `pro`, `enterprise` |
| `previewUrl` | Text (Short) | Live preview link |
| `difficulty` | Enumeration | Values: `beginner`, `intermediate`, `advanced` |

### Step 1.2: Content Type Schema

After creation, your schema should look like this:

```javascript
// src/api/template/content-types/template/schema.json
{
  "kind": "collectionType",
  "collectionName": "templates",
  "info": {
    "singularName": "template",
    "pluralName": "templates",
    "displayName": "Template",
    "description": "Starter templates for Webstudio projects"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "projectId": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "description": {
      "type": "text"
    },
    "thumbnail": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "category": {
      "type": "enumeration",
      "enum": ["business", "portfolio", "ecommerce", "blog", "landing"],
      "default": "business"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "order": {
      "type": "integer",
      "default": 0
    },
    "status": {
      "type": "enumeration",
      "enum": ["draft", "published", "archived"],
      "default": "draft"
    },
    "pricing": {
      "type": "enumeration",
      "enum": ["free", "pro", "enterprise"],
      "default": "free"
    },
    "previewUrl": {
      "type": "string"
    },
    "tags": {
      "type": "json"
    }
  }
}
```

### Step 1.3: Configure API Permissions

1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Click on **Public**
3. Under **Template**, enable:
   - ✅ `find` (list all templates)
   - ✅ `findOne` (get single template)
4. Click **Save**

---

## 🔌 Part 2: Webstudio Integration

### Step 2.1: Add Strapi Configuration

Add to your `.env` file:

```env
# Strapi CMS Configuration
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-api-token-here  # Optional: for authenticated requests
```

### Step 2.2: Create Strapi Client

Create a new file for the Strapi API client:

```typescript
// apps/builder/app/services/strapi.server.ts

import env from "~/env/env.server";

const STRAPI_URL = env.STRAPI_URL ?? "http://localhost:1337";
const STRAPI_API_TOKEN = env.STRAPI_API_TOKEN;

interface StrapiTemplate {
  id: number;
  attributes: {
    title: string;
    projectId: string;
    description: string | null;
    thumbnail: {
      data: {
        attributes: {
          url: string;
          formats: {
            thumbnail?: { url: string };
            small?: { url: string };
            medium?: { url: string };
          };
        };
      } | null;
    };
    category: string;
    featured: boolean;
    order: number;
    status: "draft" | "published" | "archived";
    pricing: "free" | "pro" | "enterprise";
    previewUrl: string | null;
    tags: string[] | null;
  };
}

interface StrapiResponse<T> {
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

/**
 * Fetch templates from Strapi CMS
 */
export const fetchTemplatesFromStrapi = async (): Promise<StrapiTemplate[]> => {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add auth token if configured
    if (STRAPI_API_TOKEN) {
      headers["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const response = await fetch(
      `${STRAPI_URL}/api/templates?` +
        new URLSearchParams({
          "filters[status][$eq]": "published",
          "sort[0]": "order:asc",
          "sort[1]": "createdAt:desc",
          "populate": "thumbnail",
        }),
      { headers }
    );

    if (!response.ok) {
      console.error(`[Strapi] Failed to fetch templates: ${response.status}`);
      return [];
    }

    const data: StrapiResponse<StrapiTemplate[]> = await response.json();
    return data.data;
  } catch (error) {
    console.error("[Strapi] Error fetching templates:", error);
    return [];
  }
};

/**
 * Fetch featured templates only
 */
export const fetchFeaturedTemplates = async (): Promise<StrapiTemplate[]> => {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (STRAPI_API_TOKEN) {
      headers["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const response = await fetch(
      `${STRAPI_URL}/api/templates?` +
        new URLSearchParams({
          "filters[status][$eq]": "published",
          "filters[featured][$eq]": "true",
          "sort[0]": "order:asc",
          "populate": "thumbnail",
        }),
      { headers }
    );

    if (!response.ok) {
      return [];
    }

    const data: StrapiResponse<StrapiTemplate[]> = await response.json();
    return data.data;
  } catch (error) {
    console.error("[Strapi] Error fetching featured templates:", error);
    return [];
  }
};

/**
 * Fetch templates by category
 */
export const fetchTemplatesByCategory = async (
  category: string
): Promise<StrapiTemplate[]> => {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (STRAPI_API_TOKEN) {
      headers["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const response = await fetch(
      `${STRAPI_URL}/api/templates?` +
        new URLSearchParams({
          "filters[status][$eq]": "published",
          "filters[category][$eq]": category,
          "sort[0]": "order:asc",
          "populate": "thumbnail",
        }),
      { headers }
    );

    if (!response.ok) {
      return [];
    }

    const data: StrapiResponse<StrapiTemplate[]> = await response.json();
    return data.data;
  } catch (error) {
    console.error("[Strapi] Error fetching templates by category:", error);
    return [];
  }
};

/**
 * Transform Strapi template to Webstudio format
 */
export const transformStrapiTemplate = (template: StrapiTemplate) => {
  const { attributes } = template;
  
  // Get thumbnail URL
  let thumbnailUrl: string | undefined;
  if (attributes.thumbnail?.data?.attributes) {
    const formats = attributes.thumbnail.data.attributes.formats;
    thumbnailUrl =
      formats?.medium?.url ||
      formats?.small?.url ||
      formats?.thumbnail?.url ||
      attributes.thumbnail.data.attributes.url;
    
    // Prepend Strapi URL if relative
    if (thumbnailUrl && !thumbnailUrl.startsWith("http")) {
      thumbnailUrl = `${STRAPI_URL}${thumbnailUrl}`;
    }
  }

  return {
    id: template.id,
    projectId: attributes.projectId,
    title: attributes.title,
    description: attributes.description,
    thumbnailUrl,
    category: attributes.category,
    featured: attributes.featured,
    pricing: attributes.pricing,
    previewUrl: attributes.previewUrl,
    tags: attributes.tags ?? [],
  };
};
```

### Step 2.3: Update Dashboard Loader

Modify the dashboard loader to fetch from Strapi:

```typescript
// In apps/builder/app/routes/_ui.dashboard.tsx

import { 
  fetchTemplatesFromStrapi, 
  transformStrapiTemplate 
} from "~/services/strapi.server";

// In the loader function:
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // ... existing code ...

  // Fetch templates from Strapi instead of env
  const strapiTemplates = await fetchTemplatesFromStrapi();
  const templateProjectIds = strapiTemplates.map(
    (t) => t.attributes.projectId
  );

  // Fetch the actual project data from Webstudio database
  const templates = templateProjectIds.length > 0
    ? await findManyByIds({ projectIds: templateProjectIds }, context)
    : [];

  // Merge Strapi metadata with Webstudio project data
  const enrichedTemplates = templates.map((project) => {
    const strapiData = strapiTemplates.find(
      (t) => t.attributes.projectId === project.id
    );
    
    return {
      ...project,
      strapiMeta: strapiData ? transformStrapiTemplate(strapiData) : null,
    };
  });

  return {
    // ... other data ...
    templates: enrichedTemplates,
  };
};
```

### Step 2.4: Update Templates Component

Update the templates display component:

```typescript
// In apps/builder/app/dashboard/templates/templates.tsx

interface EnrichedTemplate {
  id: string;
  title: string;
  // ... Webstudio project fields ...
  strapiMeta: {
    description: string | null;
    thumbnailUrl: string | undefined;
    category: string;
    featured: boolean;
    pricing: string;
    previewUrl: string | null;
    tags: string[];
  } | null;
}

export const TemplatesGrid = ({ 
  templates 
}: { 
  templates: EnrichedTemplate[] 
}) => {
  // Group by category
  const categories = [...new Set(
    templates
      .filter((t) => t.strapiMeta)
      .map((t) => t.strapiMeta!.category)
  )];

  return (
    <div>
      {/* Featured Section */}
      <section>
        <h2>Featured Templates</h2>
        <div className="grid">
          {templates
            .filter((t) => t.strapiMeta?.featured)
            .map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
        </div>
      </section>

      {/* Category Sections */}
      {categories.map((category) => (
        <section key={category}>
          <h2>{category}</h2>
          <div className="grid">
            {templates
              .filter((t) => t.strapiMeta?.category === category)
              .map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
};
```

---

## 🎨 Part 3: Strapi Admin Workflow

### Adding a New Template

1. **Create the project in Webstudio**
   - Design your template
   - Copy the project ID from the URL

2. **Add template in Strapi**
   - Go to Strapi Admin → Content Manager → Templates
   - Click "Create new entry"
   - Fill in:
     - **Title**: Display name
     - **Project ID**: Paste the Webstudio project ID
     - **Description**: What the template is for
     - **Thumbnail**: Upload a preview image
     - **Category**: Select appropriate category
     - **Featured**: Toggle if it should be highlighted
     - **Order**: Lower numbers appear first
     - **Status**: Set to "published" when ready

3. **Publish**
   - Click "Save" then "Publish"
   - Template appears immediately in Webstudio dashboard

### Managing Templates

| Action | How To |
|--------|--------|
| **Hide a template** | Set status to "draft" or "archived" |
| **Reorder templates** | Change the "order" number |
| **Feature a template** | Toggle "featured" to true |
| **Remove a template** | Delete from Strapi (or archive) |
| **Update metadata** | Edit and save - instant update |

---

## 🔒 Part 4: Security Considerations

### API Token Setup

1. Go to **Settings** → **API Tokens**
2. Click **Create new API Token**
3. Configure:
   - Name: `Webstudio Templates`
   - Type: `Read-only`
   - Duration: Unlimited or custom
4. Copy token to `.env`:
   ```env
   STRAPI_API_TOKEN=your-generated-token
   ```

### Rate Limiting

Add caching to prevent excessive API calls:

```typescript
// Simple in-memory cache
let templateCache: {
  data: StrapiTemplate[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const fetchTemplatesFromStrapi = async (): Promise<StrapiTemplate[]> => {
  // Return cached data if fresh
  if (templateCache && Date.now() - templateCache.timestamp < CACHE_TTL) {
    return templateCache.data;
  }

  // Fetch fresh data
  const data = await fetchFromApi();
  
  // Update cache
  templateCache = {
    data,
    timestamp: Date.now(),
  };

  return data;
};
```

---

## 📊 Part 5: Database Schema Reference

### Strapi SQLite/PostgreSQL Tables

When you create the Template content type, Strapi creates:

```sql
-- Main templates table
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  project_id VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  featured BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  pricing VARCHAR(20) DEFAULT 'free',
  preview_url VARCHAR(255),
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  created_by_id INTEGER,
  updated_by_id INTEGER
);

-- Media relation table
CREATE TABLE templates_thumbnail_links (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES templates(id),
  file_id INTEGER REFERENCES files(id)
);
```

---

## 🔄 Part 6: Migration from .env

### Before (Environment-Based)

```env
PROJECT_TEMPLATES=abc123,def456,ghi789
```

### After (Strapi-Based)

1. Keep `.env` templates as fallback:
   ```env
   PROJECT_TEMPLATES=abc123,def456,ghi789
   STRAPI_URL=http://localhost:1337
   USE_STRAPI_TEMPLATES=true
   ```

2. Hybrid loader:
   ```typescript
   const loadTemplates = async (context) => {
     if (env.USE_STRAPI_TEMPLATES === "true") {
       // Try Strapi first
       const strapiTemplates = await fetchTemplatesFromStrapi();
       if (strapiTemplates.length > 0) {
         return strapiTemplates.map((t) => t.attributes.projectId);
       }
     }
     
     // Fallback to env
     return env.PROJECT_TEMPLATES ?? [];
   };
   ```

---

## ✅ Checklist

### Strapi Setup
- [ ] Create Template content type
- [ ] Add all required fields
- [ ] Configure public API permissions
- [ ] Create API token for Webstudio

### Webstudio Integration
- [ ] Add `STRAPI_URL` to .env
- [ ] Create strapi.server.ts client
- [ ] Update dashboard loader
- [ ] Update templates component

### Content
- [ ] Add existing template projects to Strapi
- [ ] Upload thumbnail images
- [ ] Set categories and ordering
- [ ] Publish templates

### Testing
- [ ] Verify API returns templates
- [ ] Test template display in dashboard
- [ ] Test clone functionality
- [ ] Test category filtering

---

## 📁 File Structure

```
autobuilder-suite/
├── cms/                                    # Strapi CMS
│   └── src/
│       └── api/
│           └── template/                   # Template content type
│               ├── content-types/
│               │   └── template/
│               │       └── schema.json
│               ├── controllers/
│               ├── routes/
│               └── services/
│
└── builder/
    └── webstudio/
        └── apps/
            └── builder/
                └── app/
                    ├── env/
                    │   └── env.server.ts   # Add STRAPI_URL
                    ├── services/
                    │   └── strapi.server.ts # NEW: Strapi client
                    ├── routes/
                    │   └── _ui.dashboard.tsx # Update loader
                    └── dashboard/
                        └── templates/
                            └── templates.tsx # Update component
```

---

## 🚀 Quick Start Commands

```bash
# 1. Start Strapi
cd cms
npm run develop

# 2. Create Template content type in admin panel
# http://localhost:1337/admin

# 3. Add environment variables
echo "STRAPI_URL=http://localhost:1337" >> ../builder/webstudio/apps/builder/.env

# 4. Restart Webstudio
cd ../builder/webstudio
pnpm dev
```

---

## 📚 Resources

- [Strapi Documentation](https://docs.strapi.io/)
- [Strapi REST API](https://docs.strapi.io/dev-docs/api/rest)
- [Strapi Content Types](https://docs.strapi.io/dev-docs/backend-customization/models)
- [Webstudio Documentation](https://docs.webstudio.is/)
