# Project Publishing - Conceptualization

> A guide for understanding and working with project publishing in Autobuilder Suite.

---

## 📋 Overview

Publishing transforms a project from the builder into a live website. Autobuilder Suite supports two publishing destinations:

| Destination | Description | Use Case |
|-------------|-------------|----------|
| **SaaS** | Hosted on Autobuilder infrastructure | Quick, managed hosting |
| **Static** | Downloadable zip for self-hosting | Docker, Vercel, Netlify, etc. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLISHING FLOW                           │
└─────────────────────────────────────────────────────────────┘

  Builder UI                 API                    Deployment
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Publish      │       │ domain.ts    │       │ Deployment   │
│ Dialog       │ ────► │ publish()    │ ────► │ Service      │
│              │       │ mutation     │       │              │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Domain       │       │ Build        │       │ CDN/Static   │
│ Selection    │       │ Created      │       │ Files        │
└──────────────┘       └──────────────┘       └──────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `apps/builder/.../topbar/publish.tsx` | Publish dialog UI |
| `apps/builder/.../topbar/domains.tsx` | Domain management |
| `packages/domain/src/trpc/domain.ts` | Publish API endpoint |
| `packages/sdk/src/schema/deployment.ts` | Deployment types |
| `packages/trpc-interface/src/shared/deployment.ts` | Deployment router |

---

## 🌐 SaaS Publishing

### How It Works

1. User clicks **Publish** in topbar
2. Selects domains to publish to
3. Build is created with deployment metadata
4. Deployment service publishes to CDN
5. Site is live at `project-domain.wstd.work`

### Domain Types

| Type | Format | Example |
|------|--------|---------|
| **Project Domain** | `{subdomain}.{publisherHost}` | `my-site.wstd.work` |
| **Custom Domain** | User's own domain | `www.mysite.com` |

### Publish Flow

```typescript
// 1. User submits publish form
const domains = formData.getAll("domainToPublish[]");

// 2. API call
const result = await nativeClient.domain.publish.mutate({
  projectId: project.id,
  domains: ["my-site.wstd.work", "www.mysite.com"],
  destination: "saas",
});

// 3. Build created with deployment
const deployment = {
  destination: "saas",
  domains: ["my-site.wstd.work", "www.mysite.com"],
  assetsDomain: "my-site.wstd.work",
};
```

### Build Status

| Status | Description |
|--------|-------------|
| `PENDING` | Build in progress |
| `PUBLISHED` | Successfully deployed |
| `FAILED` | Deployment failed |

```typescript
// Status check with timeout (3 min)
const getPublishStatusAndText = ({ createdAt, publishStatus }) => {
  const delta = Date.now() - new Date(createdAt).getTime();
  
  if (publishStatus === "PENDING" && delta > 180000) {
    return { status: "FAILED", text: "Build timed out" };
  }
  
  return { status: publishStatus, text: "..." };
};
```

---

## 📦 Static Publishing

### How It Works

1. User clicks **Export** tab
2. Selects deploy target (Docker, Vercel, Netlify, etc.)
3. Build is created with static destination
4. Zip file generated and downloaded
5. User deploys to their own infrastructure

### Deploy Targets

```typescript
const deployTargets = {
  docker: {
    docs: "https://docs.docker.com",
    command: `docker build -t my-image .
docker run my-image`,
  },
  static: {
    templates: ["ssg"],
  },
  vercel: {
    docs: "https://vercel.com/docs/cli",
    command: "npx vercel@latest",
    templates: ["ssg-vercel"],
  },
  netlify: {
    docs: "https://docs.netlify.com/cli/get-started/",
    command: `npx netlify-cli@latest login
npx netlify-cli sites:create
npx netlify-cli build
npx netlify-cli deploy`,
    templates: ["ssg-netlify"],
  },
};
```

### Template Types

| Template | Output |
|----------|--------|
| `docker` | Dockerfile + Node.js app |
| `ssg` | Static HTML/CSS/JS |
| `ssg-vercel` | Vercel-optimized static |
| `ssg-netlify` | Netlify-optimized static |

### Static Export Flow

```typescript
// 1. Request static build
const result = await nativeClient.domain.publish.mutate({
  projectId,
  destination: "static",
  templates: ["ssg-vercel"],
});

// 2. Build created with static deployment
const deployment = {
  destination: "static",
  name: `${projectId}-abc123.zip`,
  assetsDomain: "my-site.wstd.work",
  templates: ["ssg-vercel"],
};

// 3. Download when ready
window.location.href = `/cgi/static/ssg/${result.name}`;
```

---

## 🔧 Domain Management

### Adding Custom Domains

```
┌─────────────────────────────────────────────────────────────┐
│  Custom Domain Setup                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Add domain in Publish dialog                            │
│  2. Get DNS records:                                         │
│     - CNAME: www → {project}.wstd.work                      │
│     - TXT: _webstudio-verify → {verification-code}          │
│  3. Add records to DNS provider                             │
│  4. Wait for verification (propagation)                     │
│  5. Domain status changes to ACTIVE + VERIFIED              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Domain Status

| Status | Verified | Meaning |
|--------|----------|---------|
| `INITIALIZING` | ❌ | Just added |
| `PENDING` | ❌ | Waiting for DNS |
| `ACTIVE` | ✅ | Ready to publish |
| `ERROR` | ❌ | DNS misconfigured |

### Database Schema

```sql
-- Domain table
CREATE TABLE "Domain" (
  id TEXT PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "txtRecord" TEXT,      -- Verification TXT record
  "cname" TEXT           -- Target CNAME
);

-- Project-Domain relationship
CREATE TABLE "ProjectDomain" (
  "projectId" TEXT REFERENCES "Project"(id),
  "domainId" TEXT REFERENCES "Domain"(id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY ("projectId", "domainId")
);
```

---

## 📊 Build & Deployment Schema

### Build Table

```sql
CREATE TABLE "Build" (
  id TEXT PRIMARY KEY,
  "projectId" TEXT REFERENCES "Project"(id),
  pages TEXT,                    -- Serialized pages data
  deployment TEXT,               -- JSON deployment config
  "publishStatus" TEXT,          -- PENDING | PUBLISHED | FAILED
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);
```

### Deployment JSON

```typescript
// SaaS deployment
{
  "destination": "saas",
  "domains": ["my-site.wstd.work", "www.mysite.com"],
  "assetsDomain": "my-site.wstd.work",
  "excludeWstdDomainFromSearch": true  // If custom domain
}

// Static deployment
{
  "destination": "static",
  "name": "project-abc123.zip",
  "assetsDomain": "my-site.wstd.work",
  "templates": ["ssg-vercel"]
}
```

---

## 🔐 Plan Features & Limits

### Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Project domain | ✅ | ✅ |
| Custom domains | ❌ | ✅ |
| Domain selection on publish | ❌ (all) | ✅ |
| Staging preview | ❌ | ✅ |
| Publish limit | Limited | Unlimited |

### Enforcement

```typescript
// Check plan features
const { hasProPlan, maxDomainsAllowedPerUser } = useStore($userPlanFeatures);

// Free users publish to all domains automatically
const domains = hasProPlan
  ? formData.getAll("domainToPublish[]")  // User selects
  : [project.domain, ...allVerifiedDomains]; // All verified
```

---

## 🎯 UI Components

### Publish Dialog Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Publish                                              [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Domains                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☑ my-site.wstd.work         Published 2 min ago    🔗  ││
│  │   Domain: [my-site_______]                              ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☑ www.mysite.com            Published 2 min ago    🔗  ││
│  │   Status: ACTIVE ✓                                      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  [+ Add domain]                                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [       Publish        ]                                    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Export                                                      │
│  Destination: [Docker ▼]                                     │
│                                                              │
│  [Build and download static site]                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `Publish` | publish.tsx | Main publish button & logic |
| `ChangeProjectDomain` | publish.tsx | Edit project subdomain |
| `Domains` | domains.tsx | List custom domains |
| `AddDomain` | add-domain.tsx | Add new custom domain |
| `DomainCheckbox` | domain-checkbox.tsx | Select domains to publish |
| `PublishStatic` | publish.tsx | Static export section |

---

## ✅ Implementation Checklist

### Publishing Works When:
- [ ] PostgreSQL + PostgREST running
- [ ] `Build` table with proper schema
- [ ] `Domain` and `ProjectDomain` tables exist
- [ ] `latestBuildVirtual` function created
- [ ] Deployment service configured (or stubbed)
- [ ] `PUBLISHER_HOST` env set

### To Test Publishing:
1. Create a project in builder
2. Add some content/pages
3. Click Publish in topbar
4. Check Build table for new record
5. Verify publishStatus updates

### To Enable Custom Domains:
1. Set `hasProPlan: true` in plan features
2. Configure DNS verification service
3. Set up SSL certificate provisioning
4. Update deployment service for custom domains

---

## 🔗 Related Files

```
autobuilder-suite/builder/webstudio/
├── apps/builder/app/builder/features/topbar/
│   ├── publish.tsx              # Main publish dialog
│   ├── domains.tsx              # Domain list component
│   ├── domain-checkbox.tsx      # Domain selection
│   ├── add-domain.tsx           # Add domain form
│   └── collapsible-domain-section.tsx
├── packages/
│   ├── domain/src/trpc/domain.ts   # Publish API
│   ├── sdk/src/schema/deployment.ts # Types
│   └── trpc-interface/src/shared/deployment.ts
└── builder/
    └── temp-virtual-tables.sql     # Build views
```

---

## 🚀 Environment Variables

```env
# Publisher host for project domains
PUBLISHER_HOST=wstd.work

# Staging credentials (for preview)
STAGING_USERNAME=admin
STAGING_PASSWORD=secret

# Deployment service (optional for static-only)
DEPLOYMENT_URL=https://deploy.example.com
```

---

*Last updated: January 11, 2026*
