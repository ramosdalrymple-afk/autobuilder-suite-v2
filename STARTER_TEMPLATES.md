# Starter Templates - Conceptualization

> A guide for implementing and managing starter templates in Autobuilder Suite.

---

## 📋 Overview

Starter templates allow users to quickly create new projects from pre-designed layouts. When a user clicks on a template, a **clone** of that project is created in their account.

---

## 🏗️ Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HOW TEMPLATES WORK                        │
└─────────────────────────────────────────────────────────────┘

   .env                    Dashboard Loader              UI
┌──────────────┐         ┌──────────────────┐       ┌──────────────┐
│ PROJECT_     │ ──────► │ findManyByIds()  │ ────► │ TemplatesGrid│
│ TEMPLATES=   │         │ Fetches projects │       │ TemplateCard │
│ id1,id2,id3  │         │ by IDs           │       │ CloneDialog  │
└──────────────┘         └──────────────────┘       └──────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `apps/builder/app/env/env.server.ts` | Reads `PROJECT_TEMPLATES` from .env |
| `apps/builder/app/routes/_ui.dashboard.tsx` | Loads templates in dashboard |
| `apps/builder/app/dashboard/templates/templates.tsx` | Templates grid view |
| `apps/builder/app/dashboard/templates/template-card.tsx` | Individual template card |
| `shared/clone-project/CloneProjectDialog.tsx` | Clones template to user's projects |

---

## ⚡ Quick Start (Current System)

### Step 1: Create Template Projects
Build your template projects in the builder as normal projects.

### Step 2: Get Project IDs
Find the project IDs from the database or browser URL:
```
https://wstd.dev:5173/dashboard/project/[PROJECT_ID]/...
```

### Step 3: Update Environment
Add to `.env`:
```env
PROJECT_TEMPLATES=abc123,def456,ghi789
```

### Step 4: Restart Server
Templates will appear in the "Starter Templates" section.

---

## 🎯 Implementation Options

### Option 1: Environment-Based (Current)

**How it works:**
- Template project IDs stored in `.env` as comma-separated list
- Loaded at server startup

**Pros:**
- ✅ Simple, no database changes
- ✅ Already implemented

**Cons:**
- ❌ Requires server restart to update
- ❌ No categories or metadata
- ❌ Hard to manage at scale

---

### Option 2: Database-Driven Templates

**How it works:**
- Add `isTemplate` flag to Project table
- Query templates dynamically

**Schema Changes:**
```sql
ALTER TABLE "Project" ADD COLUMN "isTemplate" BOOLEAN DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "templateCategory" TEXT;
ALTER TABLE "Project" ADD COLUMN "templateOrder" INTEGER DEFAULT 0;
ALTER TABLE "Project" ADD COLUMN "templateDescription" TEXT;
```

**Query:**
```sql
SELECT * FROM "Project" 
WHERE "isTemplate" = true AND "isDeleted" = false
ORDER BY "templateOrder", "createdAt";
```

**Pros:**
- ✅ Dynamic updates without restart
- ✅ Can add metadata (category, description, order)
- ✅ Scalable

**Cons:**
- ❌ Requires migration
- ❌ Need admin UI to manage

---

### Option 3: Template Categories

**How it works:**
- Organize templates into categories
- Filtering/tabs in UI

**Categories:**
```typescript
const templateCategories = [
  { id: "landing",    label: "Landing Pages",  icon: "🚀" },
  { id: "ecommerce",  label: "E-commerce",     icon: "🛒" },
  { id: "portfolio",  label: "Portfolio",      icon: "🎨" },
  { id: "blog",       label: "Blog",           icon: "📝" },
  { id: "saas",       label: "SaaS",           icon: "💼" },
  { id: "dashboard",  label: "Dashboards",     icon: "📊" },
  { id: "blank",      label: "Blank",          icon: "📄" },
];
```

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│  Starter Templates                          [+ New Project] │
├─────────────────────────────────────────────────────────────┤
│  [All] [Landing] [E-commerce] [Portfolio] [Blog] [Blank]    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Preview │  │ Preview │  │ Preview │  │ Preview │        │
│  │  Image  │  │  Image  │  │  Image  │  │  Image  │        │
│  ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤        │
│  │ SaaS    │  │ Agency  │  │ Shop    │  │ Blog    │        │
│  │ Landing │  │ Site    │  │ Store   │  │ Theme   │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

### Option 4: Marketplace Integration

**How it works:**
- Use existing `marketplaceApprovalStatus` field
- Community can submit templates for approval

**Status Flow:**
```
UNLISTED → PENDING → APPROVED → (visible in templates)
                  ↘ REJECTED
```

**Pros:**
- ✅ Community-driven
- ✅ Uses existing infrastructure

**Cons:**
- ❌ Requires moderation
- ❌ More complex approval flow

---

## 🎨 Recommended: Database + Categories

### Phase 1: Database Schema

```sql
-- Migration: Add template fields
ALTER TABLE "Project" 
  ADD COLUMN "isTemplate" BOOLEAN DEFAULT false,
  ADD COLUMN "templateCategory" TEXT,
  ADD COLUMN "templateOrder" INTEGER DEFAULT 0,
  ADD COLUMN "templateDescription" TEXT;

-- Create template view
CREATE OR REPLACE VIEW "TemplateProject" AS
SELECT 
  id, title, domain, "previewImageAssetId",
  "templateCategory", "templateDescription", "templateOrder"
FROM "Project" 
WHERE "isTemplate" = true AND "isDeleted" = false
ORDER BY "templateOrder", "createdAt" DESC;

-- Grant permissions
GRANT SELECT ON "TemplateProject" TO authenticated;
GRANT SELECT ON "TemplateProject" TO anon;
```

### Phase 2: Update Dashboard Loader

```typescript
// routes/_ui.dashboard.tsx

// Replace env-based loading:
// const templates = await findManyByIds(env.PROJECT_TEMPLATES);

// With database query:
const templates = await context.postgrest.client
  .from("TemplateProject")
  .select("*")
  .order("templateOrder", { ascending: true });
```

### Phase 3: Category Filter UI

```typescript
// dashboard/templates/templates.tsx
const [category, setCategory] = useState<string>("all");

const filteredTemplates = category === "all" 
  ? templates 
  : templates.filter(t => t.templateCategory === category);

return (
  <Main>
    <Header>
      <Text variant="brandSectionTitle">Starter Templates</Text>
    </Header>
    
    {/* Category Tabs */}
    <ToggleGroup value={category} onValueChange={setCategory}>
      <ToggleGroupButton value="all">All</ToggleGroupButton>
      {templateCategories.map(cat => (
        <ToggleGroupButton key={cat.id} value={cat.id}>
          {cat.icon} {cat.label}
        </ToggleGroupButton>
      ))}
    </ToggleGroup>
    
    <TemplatesGrid projects={filteredTemplates} />
  </Main>
);
```

### Phase 4: Admin Panel (Optional)

Add template management in dashboard for admins:

```
Sidebar:
├── Projects
├── Starter Templates
├── Resources
└── ⚙️ Admin (role-protected)
    └── Template Manager
        ├── Mark as Template ✓
        ├── Set Category
        ├── Set Order
        └── Edit Description
```

---

## 📁 Template Card Enhancement

```typescript
// Enhanced template-card.tsx
export const TemplateCard = ({ project }: Props) => {
  const { title, templateDescription, templateCategory, previewImageAsset } = project;
  
  return (
    <Card>
      <CardContent>
        {/* Category Badge */}
        <Badge>{getCategoryLabel(templateCategory)}</Badge>
        
        {/* Preview Image */}
        <ThumbnailWithImage name={previewImageAsset?.name} />
        
        {/* Info */}
        <Text variant="titles">{title}</Text>
        <Text variant="small" color="subtle">{templateDescription}</Text>
      </CardContent>
      
      <CardFooter>
        <Button onClick={openCloneDialog}>Use Template</Button>
        <Button variant="ghost" onClick={openPreview}>Preview</Button>
      </CardFooter>
    </Card>
  );
};
```

---

## ✅ Implementation Checklist

### Minimum Viable (Use Current System)
- [ ] Create 3-5 template projects in builder
- [ ] Add project IDs to `PROJECT_TEMPLATES` in .env
- [ ] Add preview images to each template
- [ ] Test clone functionality

### Enhanced (Database-Driven)
- [ ] Run database migration (add template columns)
- [ ] Create `TemplateProject` view
- [ ] Update dashboard loader to query view
- [ ] Add category filter tabs to UI
- [ ] Update template card with category badge

### Full Feature (Admin Panel)
- [ ] Create admin route/role check
- [ ] Build template manager UI
- [ ] Add reordering (drag-drop)
- [ ] Add template analytics (usage count)

---

## 🔗 Related Files

```
autobuilder-suite/builder/webstudio/
├── apps/builder/app/
│   ├── env/env.server.ts              # PROJECT_TEMPLATES env
│   ├── routes/_ui.dashboard.tsx        # Template loader
│   ├── routes/_ui.dashboard.templates.tsx
│   └── dashboard/
│       ├── templates/
│       │   ├── templates.tsx           # Grid view
│       │   └── template-card.tsx       # Card component
│       └── shared/
│           └── clone-project/          # Clone dialog
└── packages/dashboard/
    └── src/
        ├── db/projects.ts              # Database queries
        └── trpc/project-router.ts      # API routes
```

---

*Last updated: January 11, 2026*
