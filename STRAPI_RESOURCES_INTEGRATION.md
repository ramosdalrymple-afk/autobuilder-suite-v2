# Strapi Resources Integration

> A guide for connecting Strapi CMS content to Webstudio pages using the Resources feature.

---

## 📋 Overview

Webstudio's **Resources** feature allows you to fetch data from external APIs and bind it to your page components. Combined with Strapi as a headless CMS, this enables:

- **Dynamic content** managed by non-developers
- **Real-time updates** without rebuilding
- **Rich media handling** with Strapi's media library
- **Structured content** with relations and components

---

## ✅ Integration Status

The Strapi integration has been implemented with the following components:

### Webstudio Builder
| Component | Location | Status |
|-----------|----------|--------|
| Environment Variables | `apps/builder/.env` | ✅ Configured |
| Strapi Client Service | `app/services/strapi.server.ts` | ✅ Created |
| API Proxy Route | `app/routes/rest.strapi.$.ts` | ✅ Created |

### Strapi CMS Content Types
| Content Type | API Endpoint | Status |
|--------------|--------------|--------|
| Article | `/api/articles` | ✅ Created |
| Product | `/api/products` | ✅ Created |
| Team Member | `/api/team-members` | ✅ Created |
| Testimonial | `/api/testimonials` | ✅ Created |
| FAQ | `/api/faqs` | ✅ Created |
| Project | `/api/projects` | ✅ Created |
| Service | `/api/services` | ✅ Created |
| Website Template | `/api/website-templates` | ✅ Created |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW                                     │
└─────────────────────────────────────────────────────────────────┘

   Content Editor              Strapi API             Webstudio Proxy
   ┌──────────────┐          ┌──────────────┐       ┌──────────────┐
   │  Creates/    │          │  REST API    │       │/rest/strapi/*│
   │  Edits       │ ──────►  │ :1337/api/*  │ ────► │  Transforms  │
   │  Content     │          │              │       │  URLs/Data   │
   └──────────────┘          └──────────────┘       └──────────────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  Webstudio   │
                                                    │  Resources   │
                                                    │  fetch JSON  │
                                                    └──────────────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  Binds to    │
                                                    │  Components  │
                                                    │  (text, img) │
                                                    └──────────────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  Published   │
                                                    │  Website     │
                                                    └──────────────┘
```

### Proxy Route Benefits

The integration uses a server-side proxy (`/rest/strapi/*`) that:
- **Hides Strapi URL** from client-side code
- **Transforms image URLs** to absolute paths automatically
- **Adds caching headers** for better performance
- **Validates collections** for security

---

## 🔧 Configuration

### Environment Variables

Located in `apps/builder/.env`:

```env
# Strapi CMS Integration
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=
```

### Generating an API Token

1. Open Strapi admin: http://localhost:1337/admin
2. Go to **Settings** → **API Tokens**
3. Click **Create new API Token**
4. Configure:
   - Name: `Webstudio`
   - Token duration: Unlimited (or as needed)
   - Token type: `Read-only`
5. Copy the token and add to `.env` as `STRAPI_API_TOKEN`

---

## 📦 Part 1: Installed Content Types

The following content types have been created in the CMS (`/cms/src/api/`):

### 1.1 Blog / Articles

**Location:** `cms/src/api/article/`

| Field | Type | Settings |
|-------|------|----------|
| `title` | Text (Short) | Required |
| `slug` | UID | Based on title |
| `excerpt` | Text (Long) | For previews, max 300 chars |
| `content` | Rich Text | Main body |
| `featuredImage` | Media (Single) | Cover image |
| `category` | Text | Category name |
| `author` | Text | Author name |

---

### 1.2 Products (E-commerce)

**Location:** `cms/src/api/product/`

| Field | Type | Settings |
|-------|------|----------|
| `name` | Text (Short) | Required |
| `slug` | UID | Based on name |
| `description` | Rich Text | Product details |
| `price` | Decimal | Required |
| `salePrice` | Decimal | Optional |
| `sku` | Text (Short) | Unique identifier |
| `inStock` | Boolean | Default: true |
| `images` | Media (Multiple) | Product gallery |
| `category` | Text | Category name |

---

### 1.3 Team Members

**Location:** `cms/src/api/team-member/`

| Field | Type | Settings |
|-------|------|----------|
| `name` | Text (Short) | Required |
| `role` | Text (Short) | Required, job title |
| `bio` | Rich Text | Biography |
| `photo` | Media (Single) | Profile photo |
| `email` | Email | Contact |
| `linkedin` | Text (Short) | Social link |
| `twitter` | Text (Short) | Social link |
| `order` | Number | Display order, default 0 |

---

### 1.4 Testimonials

**Location:** `cms/src/api/testimonial/`

| Field | Type | Settings |
|-------|------|----------|
| `quote` | Text (Long) | Required |
| `author` | Text (Short) | Required |
| `company` | Text (Short) | Company name |
| `rating` | Number | 1-5 stars |
| `avatar` | Media (Single) | Author avatar |

---

### 1.5 FAQ

**Location:** `cms/src/api/faq/`

| Field | Type | Settings |
|-------|------|----------|
| `question` | Text (Short) | Required |
| `answer` | Rich Text | Required |
| `category` | Text | Category name |
| `order` | Number | Display order, default 0 |

---

### 1.6 Portfolio / Projects

**Location:** `cms/src/api/project/`

| Field | Type | Settings |
|-------|------|----------|
| `title` | Text (Short) | Required |
| `slug` | UID | Based on title |
| `description` | Rich Text | Project details |
| `client` | Text (Short) | Client name |
| `completedDate` | Date | Completion date |
| `images` | Media (Multiple) | Gallery |
| `category` | Text | Category name |
| `featured` | Boolean | Default: false |

---

### 1.7 Services

**Location:** `cms/src/api/service/`

| Field | Type | Settings |
|-------|------|----------|
| `title` | Text (Short) | Required |
| `slug` | UID | Based on title |
| `description` | Rich Text | Service details |
| `features` | JSON | List of features |
| `icon` | Text (Short) | Icon name/class |
| `price` | Decimal | Starting price |
| `priceUnit` | Text | Default: "per project" |
| `order` | Number | Display order, default 0 |

---

### 1.8 Website Templates

**Location:** `cms/src/api/website-template/`

| Field | Type | Settings |
|-------|------|----------|
| `name` | Text (Short) | Required |
| `description` | Text (Long) | Template description |
| `category` | Enumeration | business, portfolio, ecommerce, blog, landing, saas, agency, personal, other |
| `webstudioProjectId` | Text (Short) | Required, unique - links to Webstudio project |
| `thumbnail` | Media (Single) | Preview image |
| `previewUrl` | Text (Short) | Live preview URL |
| `features` | JSON | List of features |
| `isPremium` | Boolean | Default: false |
| `order` | Number | Display order, default 0 |

---

## 🔌 Part 2: Using the Proxy API

### 2.1 Proxy Endpoint

Instead of calling Strapi directly, use the Webstudio proxy:

| Direct Strapi | Webstudio Proxy |
|---------------|-----------------|
| `http://localhost:1337/api/articles` | `/rest/strapi/articles` |
| `http://localhost:1337/api/products/abc123` | `/rest/strapi/products/abc123` |

### 2.2 Benefits of the Proxy

1. **Automatic image URL transformation** - Relative URLs become absolute
2. **Hidden Strapi URL** - Client never sees your CMS location
3. **Built-in caching** - 60-second cache with stale-while-revalidate
4. **Security** - Only allowed collections can be accessed

### 2.3 Allowed Collections

The proxy only permits these collections:
- `articles`
- `products`
- `team-members`
- `testimonials`
- `faqs`
- `projects`
- `services`
- `website-templates`

### 2.4 Query Parameters

The proxy supports all Strapi query parameters:

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `populate` | Include relations/media | `?populate=*` or `?populate=author,category` |
| `sort` | Order results | `?sort=publishedAt:desc` |
| `filters` | Filter results | `?filters[featured][$eq]=true` |
| `pagination` | Paginate results | `?pagination[page]=1&pagination[pageSize]=10` |
| `fields` | Select specific fields | `?fields[0]=title&fields[1]=slug` |

**Common Queries via Proxy:**

```bash
# Get all articles with relations, sorted by date
/rest/strapi/articles?populate=*&sort=publishedAt:desc

# Get featured testimonials only
/rest/strapi/testimonials?filters[featured][$eq]=true&populate=avatar

# Get products in a category
/rest/strapi/products?filters[category][$eq]=electronics&populate=images

# Paginated blog posts
/rest/strapi/articles?pagination[page]=1&pagination[pageSize]=6&populate=featuredImage
```

### 2.5 Enable Public Access in Strapi

For each content type, configure permissions:

1. Go to **Settings** → **Users & Permissions** → **Roles**
2. Click **Public**
3. For each content type, enable:
   - ✅ `find` (list all)
   - ✅ `findOne` (single item)
4. Click **Save**

---

## 🎨 Part 3: Webstudio Resource Setup

### 3.1 Using Pre-configured Strapi Resources (Recommended)

The easiest way to add Strapi data to your pages is using the built-in System Resources:

1. Open your page in Webstudio Builder
2. In the left panel, find **Data** section
3. Click **"+"** to add a new variable
4. Select **System Resource** as the type
5. Choose from the Strapi presets:

| Resource | Description |
|----------|-------------|
| **Strapi: Articles** | Blog posts with title, slug, content, featured image |
| **Strapi: Products** | E-commerce items with price, description, images |
| **Strapi: Team Members** | Staff profiles with photo, bio, social links |
| **Strapi: Testimonials** | Customer reviews with rating and avatar |
| **Strapi: FAQs** | Q&A items with categories and ordering |
| **Strapi: Projects** | Portfolio items with images and client info |
| **Strapi: Services** | Business offerings with features and pricing |
| **Strapi: Templates** | Website templates with thumbnails and project IDs |

### 3.2 Adding a Custom Resource

For custom queries or filtered data, use a standard Resource:

1. Open your page in Webstudio Builder
2. In the left panel, find **Data** section
3. Click **"+"** next to **Resources**
4. Select **Resource** as the type
5. Configure the resource:

**Example: Blog Posts Resource (using proxy)**

| Setting | Value |
|---------|-------|
| **Name** | `blogPosts` |
| **Method** | `GET` |
| **URL** | `/rest/strapi/articles?populate=*&sort=publishedAt:desc` |

> **Note:** No authorization headers needed - the proxy handles authentication.

**Example: Filtered Products**

| Setting | Value |
|---------|-------|
| **Name** | `featuredProducts` |
| **Method** | `GET` |
| **URL** | `/rest/strapi/products?filters[inStock][$eq]=true&populate=images` |

### 3.2 Response Structure

**When using the proxy**, Strapi v5 returns data in this format (image URLs are automatically absolute):

```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123xyz",
      "title": "My First Blog Post",
      "slug": "my-first-blog-post",
      "excerpt": "This is a preview...",
      "content": "Full article content...",
      "publishedAt": "2026-01-13T10:00:00.000Z",
      "createdAt": "2026-01-13T09:00:00.000Z",
      "updatedAt": "2026-01-13T10:00:00.000Z",
      "featuredImage": {
        "id": 1,
        "url": "http://localhost:1337/uploads/image.jpg",
        "alternativeText": "Blog image",
        "width": 1200,
        "height": 630,
        "formats": {
          "thumbnail": { "url": "http://localhost:1337/uploads/thumbnail_image.jpg" },
          "small": { "url": "http://localhost:1337/uploads/small_image.jpg" },
          "medium": { "url": "http://localhost:1337/uploads/medium_image.jpg" }
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

> **Note:** Strapi v5 uses a flat structure (`data[0].title`) instead of nested attributes (`data[0].attributes.title`).

---

## 🔗 Part 4: Binding Data to Components

### 4.1 Using Collection Component

For displaying lists (blog posts, products, team members):

1. Add a **Collection** component to your page
2. Set the **Data** property to: `blogPosts.data`
3. Inside the collection, add your item template
4. Bind properties using `currentItem.attributes.fieldName`

### 4.2 Common Bindings (Strapi v5 flat structure)

**Text Bindings:**

| Component | Property | Binding Expression |
|-----------|----------|-------------------|
| Heading | Text | `currentItem.title` |
| Paragraph | Text | `currentItem.excerpt` |
| Link | href | `/blog/${currentItem.slug}` |
| Span | Text | `currentItem.author` |

**Image Bindings (with proxy - URLs are absolute):**

| Component | Property | Binding Expression |
|-----------|----------|-------------------|
| Image | src | `currentItem.featuredImage.url` |
| Image | alt | `currentItem.featuredImage.alternativeText` |

**Formatted Data:**

| Data Type | Expression |
|-----------|------------|
| Date | `new Date(currentItem.publishedAt).toLocaleDateString()` |
| Price | `$${currentItem.price.toFixed(2)}` |
| Rating | `${"★".repeat(currentItem.rating)}${"☆".repeat(5 - currentItem.rating)}` |

### 4.3 Conditional Display

Show elements conditionally:

```javascript
// Show "Featured" badge if featured is true
currentItem.featured ? "Featured" : ""

// Show sale price only if it exists
currentItem.salePrice ? `$${currentItem.salePrice}` : ""

// Show "In Stock" or "Out of Stock"
currentItem.inStock ? "In Stock" : "Out of Stock"

// Show premium badge
currentItem.isPremium ? "Premium" : "Free"
```

---

## 📄 Part 5: Dynamic Pages (Single Item)

### 5.1 Create Dynamic Route

1. Create a page with path: `/blog/:slug`
2. The `:slug` becomes a **System Variable**

### 5.2 Single Item Resource

Add a resource that fetches by slug (using proxy):

| Setting | Value |
|---------|-------|
| **Name** | `article` |
| **Method** | `GET` |
| **URL** | `/rest/strapi/articles?filters[slug][$eq]=${system.params.slug}&populate=*` |

### 5.3 Bind Single Item Data

Access the article data (Strapi v5 flat structure):

```javascript
// Title
article.data[0].title

// Content (rich text)
article.data[0].content

// Author name
article.data[0].author

// Featured image (absolute URL via proxy)
article.data[0].featuredImage.url

// Published date formatted
new Date(article.data[0].publishedAt).toLocaleDateString()
```

---

## 🖼️ Part 6: Image Handling

### 6.1 Image URLs

**When using the proxy:** Image URLs are automatically transformed to absolute URLs.

```javascript
// Directly use the URL
currentItem.featuredImage.url
// Returns: "http://localhost:1337/uploads/image.jpg"
```

**Direct Strapi access:** You need to prepend the Strapi URL.

```javascript
// Prepend Strapi URL
`http://localhost:1337${currentItem.featuredImage.url}`
```

### 6.2 Image Formats Available

Strapi automatically generates (when using proxy, all URLs are absolute):

| Format | Size | Binding |
|--------|------|---------|
| `thumbnail` | 156px | `currentItem.featuredImage.formats.thumbnail.url` |
| `small` | 500px | `currentItem.featuredImage.formats.small.url` |
| `medium` | 750px | `currentItem.featuredImage.formats.medium.url` |
| `large` | 1000px | `currentItem.featuredImage.formats.large.url` |
| (original) | Full size | `currentItem.featuredImage.url` |

### 6.3 Responsive Image Example

```javascript
// srcset for responsive images (via proxy)
`
  ${img.formats.small.url} 500w,
  ${img.formats.medium.url} 750w,
  ${img.formats.large.url} 1000w
`
```

---

## ⚡ Part 7: Performance Tips

### 7.1 Limit Fields

Only request fields you need:

```bash
# Instead of populate=*
/rest/strapi/articles?fields[0]=title&fields[1]=slug&fields[2]=excerpt&populate[featuredImage][fields][0]=url
```

### 7.2 Pagination

For large datasets, paginate:

```bash
/rest/strapi/articles?pagination[page]=1&pagination[pageSize]=10
```

### 7.3 Filtering

Filter on the server, not client:

```bash
# Get only published articles
/rest/strapi/articles?filters[publishedAt][$notNull]=true

# Get articles from last 30 days
/rest/strapi/articles?filters[publishedAt][$gte]=2026-01-01

# Get featured projects only
/rest/strapi/projects?filters[featured][$eq]=true
```

### 7.4 Proxy Caching

The Webstudio proxy adds caching headers:
- `max-age=60` - Browser caches for 60 seconds
- `stale-while-revalidate=300` - Serve stale content while revalidating

---

## 🔒 Part 8: Security

### 8.1 Using the Proxy (Recommended)

The Webstudio proxy handles authentication server-side:
- API token is stored in `.env` file
- Token never exposed to client
- Only allowed collections accessible

### 8.2 API Token Authentication (Direct Access)

If accessing Strapi directly:

1. In Strapi: **Settings** → **API Tokens** → **Create new**
2. Name: `Webstudio`
3. Type: `Read-only`
4. Copy the token

**In Webstudio Resource Headers:**

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer your-token-here` |

### 8.3 Environment Variables

For production, configure in `.env`:

```env
# In apps/builder/.env
STRAPI_URL=https://your-strapi-instance.com
STRAPI_API_TOKEN=your-production-token
```

The proxy will use these automatically.

---

## 📋 Part 9: Quick Reference

### Proxy Endpoint Cheatsheet

| Content | Resource Name | Proxy URL |
|---------|---------------|-----------|
| Blog List | `articles` | `/rest/strapi/articles?populate=featuredImage&sort=publishedAt:desc` |
| Single Article | `article` | `/rest/strapi/articles?filters[slug][$eq]=${system.params.slug}&populate=*` |
| Products | `products` | `/rest/strapi/products?populate=images&filters[inStock][$eq]=true` |
| Team | `team` | `/rest/strapi/team-members?sort=order:asc&populate=photo` |
| Testimonials | `testimonials` | `/rest/strapi/testimonials?populate=avatar` |
| FAQ | `faqs` | `/rest/strapi/faqs?sort=order:asc` |
| Services | `services` | `/rest/strapi/services?sort=order:asc` |
| Projects | `projects` | `/rest/strapi/projects?populate=images&filters[featured][$eq]=true` |
| Templates | `templates` | `/rest/strapi/website-templates?populate=thumbnail&sort=order:asc` |

### Binding Cheatsheet (Strapi v5)

| Data | Expression |
|------|------------|
| Item title | `currentItem.title` |
| Item image (via proxy) | `currentItem.featuredImage.url` |
| Item slug link | `/blog/${currentItem.slug}` |
| Format date | `new Date(currentItem.publishedAt).toLocaleDateString()` |
| Format price | `$${currentItem.price.toFixed(2)}` |
| Total count | `resource.meta.pagination.total` |
| Is premium | `currentItem.isPremium ? "Premium" : "Free"` |

---

## 🚀 Part 10: Example Workflows

### Blog Website

1. **Strapi Setup:**
   - Content types already created: `Article`
   - Add sample articles with images via http://localhost:1337/admin

2. **Webstudio Pages:**
   - `/blog` - List page with Collection
   - `/blog/:slug` - Single article page

3. **Resources (using proxy):**
   ```
   articles: GET /rest/strapi/articles?populate=*&sort=publishedAt:desc
   article: GET /rest/strapi/articles?filters[slug][$eq]=${system.params.slug}&populate=*
   ```

### Portfolio Website

1. **Strapi Setup:**
   - Content types already created: `Project`
   - Add portfolio projects with galleries

2. **Webstudio Pages:**
   - `/work` - Portfolio grid
   - `/work/:slug` - Project detail

3. **Resources (using proxy):**
   ```
   projects: GET /rest/strapi/projects?populate=images&filters[featured][$eq]=true
   project: GET /rest/strapi/projects?filters[slug][$eq]=${system.params.slug}&populate=*
   ```

### E-commerce Catalog

1. **Strapi Setup:**
   - Content types already created: `Product`
   - Add products with images, prices

2. **Webstudio Pages:**
   - `/products` - Product grid
   - `/products/:slug` - Product detail

3. **Resources (using proxy):**
   ```
   products: GET /rest/strapi/products?populate=images&pagination[pageSize]=12
   product: GET /rest/strapi/products?filters[slug][$eq]=${system.params.slug}&populate=*
   ```

### Template Gallery

1. **Strapi Setup:**
   - Content types already created: `WebsiteTemplate`
   - Link templates to Webstudio project IDs

2. **Usage:**
   ```
   templates: GET /rest/strapi/website-templates?populate=thumbnail&sort=order:asc
   ```

---

## ✅ Checklist

### Strapi Setup
- [x] Create required content types
- [x] Configure field types and validations
- [ ] Enable public API access (find, findOne) in Settings
- [ ] Create API token for production
- [ ] Add sample content for testing

### Webstudio Integration
- [x] Strapi environment variables configured
- [x] Strapi client service created
- [x] API proxy route created
- [ ] Restart Webstudio to pick up .env changes

### Data Binding
- [ ] Add resources to pages using proxy URLs
- [ ] Add Collection component for lists
- [ ] Bind text fields to data (Strapi v5 flat structure)
- [ ] Bind images (URLs are absolute via proxy)
- [ ] Format dates and numbers
- [ ] Add conditional displays

### Dynamic Pages
- [ ] Create parameterized routes (`:slug`)
- [ ] Add single-item resources with slug filter
- [ ] Bind page content to resource data
- [ ] Set up SEO meta from data

---

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 403 Forbidden on proxy | Collection not in allowed list - check `rest.strapi.$.ts` |
| Empty data array | Enable public access in Strapi Settings → Roles → Public |
| Image URLs not loading | Strapi must be running on configured `STRAPI_URL` |
| CORS errors (direct access) | Use the proxy instead, or configure Strapi CORS |

### Verifying the Integration

1. **Check Strapi is running:** http://localhost:1337/admin
2. **Test direct API:** http://localhost:1337/api/articles
3. **Test proxy:** http://localhost:5173/rest/strapi/articles

---

## 📚 Resources

- [Strapi REST API Documentation](https://docs.strapi.io/dev-docs/api/rest)
- [Strapi Filters & Sorting](https://docs.strapi.io/dev-docs/api/rest/filters-locale-publication)
- [Strapi Population](https://docs.strapi.io/dev-docs/api/rest/populate-select)
- [Webstudio Documentation](https://docs.webstudio.is/)

---

## 📁 File Locations

| Component | Path |
|-----------|------|
| Strapi CMS | `/cms/` |
| Content Types | `/cms/src/api/*/` |
| Webstudio Builder | `/autobuilder-suite/builder/webstudio/apps/builder/` |
| Strapi Client | `app/services/strapi.server.ts` |
| Proxy Route | `app/routes/rest.strapi.$.ts` |
| Environment | `.env` |
