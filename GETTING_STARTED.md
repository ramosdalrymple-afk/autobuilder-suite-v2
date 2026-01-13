# 🚀 Getting Started with ABS

> Complete setup guide for running AutoBuilder Suite on a new system

---

## 📋 Table of Contents

- [Option 1: Dev Container (Recommended)](#option-1-dev-container-recommended)
- [Option 2: Manual Setup](#option-2-manual-setup)
- [Starting the Services](#starting-the-services)
- [First-Time Configuration](#first-time-configuration)
- [Common Issues](#common-issues)

---

## Option 1: Dev Container (Recommended)

**Best for:** Quick setup, consistent environment, team collaboration

### Prerequisites

| Software | Version | Download |
|----------|---------|----------|
| Docker Desktop | Latest | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/ramosdalrymple-afk/autobuilder-suitev2.git
cd autobuilder-suitev2

# 2. Open in VS Code
code .
```

3. **Install the Dev Containers extension** when prompted (or install manually: `ms-vscode-remote.remote-containers`)

4. **Click "Reopen in Container"** when the popup appears

   ![Reopen in Container](https://code.visualstudio.com/assets/docs/devcontainers/containers/dev-container-reopen-prompt.png)

   Or press `F1` → type `Reopen in Container` → Enter

5. **Wait for setup** (~5-10 minutes on first run)
   - Docker images will be built
   - Dependencies will be installed
   - Database will be initialized

6. **You're ready!** Open a terminal in VS Code and run:
   ```bash
   ws && pnpm dev
   ```

---

## Option 2: Manual Setup

**Best for:** Custom configurations, production-like environment, no Docker

### Prerequisites

| Software | Version | Verify Command |
|----------|---------|----------------|
| Node.js | 20.x or higher | `node --version` |
| pnpm | 9.14.4 | `pnpm --version` |
| PostgreSQL | 15.x | `psql --version` |
| Git | Latest | `git --version` |

### Step 1: Install Node.js

**Windows (winget):**
```powershell
winget install OpenJS.NodeJS.LTS
```

**macOS (Homebrew):**
```bash
brew install node@20
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Install pnpm

```bash
corepack enable
corepack prepare pnpm@9.14.4 --activate
```

Or with npm:
```bash
npm install -g pnpm@9.14.4
```

### Step 3: Install PostgreSQL

**Windows:**
```powershell
winget install PostgreSQL.PostgreSQL
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 4: Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/ramosdalrymple-afk/autobuilder-suitev2.git
cd autobuilder-suitev2

# Install Webstudio dependencies
cd autobuilder-suite/builder/webstudio
pnpm install

# Install Strapi dependencies
cd ../../../cms
npm install
```

### Step 5: Setup Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Run these SQL commands:
CREATE USER webstudio WITH PASSWORD 'password';
CREATE DATABASE webstudio OWNER webstudio;
GRANT ALL PRIVILEGES ON DATABASE webstudio TO webstudio;
\q
```

### Step 6: Setup PostgREST

**Option A: Docker (easiest)**
```bash
docker run -d \
  --name postgrest \
  -p 3000:3000 \
  -e PGRST_DB_URI="postgresql://webstudio:password@host.docker.internal:5432/webstudio" \
  -e PGRST_DB_SCHEMAS="public" \
  -e PGRST_DB_ANON_ROLE="anon" \
  -e PGRST_JWT_SECRET="jwtsecretjwtsecretjwtsecretjwtsecretjwtsecret" \
  postgrest/postgrest
```

**Option B: Binary**
1. Download from [github.com/PostgREST/postgrest/releases](https://github.com/PostgREST/postgrest/releases)
2. Create `postgrest.conf`:
   ```
   db-uri = "postgresql://webstudio:password@localhost:5432/webstudio"
   db-schemas = "public"
   db-anon-role = "anon"
   jwt-secret = "jwtsecretjwtsecretjwtsecretjwtsecretjwtsecret"
   ```
3. Run: `./postgrest postgrest.conf`

### Step 7: Configure Environment

**Webstudio** (`autobuilder-suite/builder/webstudio/apps/builder/.env`):
```env
# Database
DATABASE_URL=postgresql://webstudio:password@localhost:5432/webstudio?schema=public
DIRECT_URL=postgresql://webstudio:password@localhost:5432/webstudio?schema=public

# PostgREST
POSTGREST_URL=http://localhost:3000
POSTGREST_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqoUt20nEV9cklpv9e3yw3PVyZLmKs5qLD6nGL1SI

# Auth
DEV_LOGIN=true
AUTH_SECRET=your-secret-key-here

# System
NODE_ENV=development
```

**Strapi** (`cms/.env`):
```env
HOST=0.0.0.0
PORT=1337
APP_KEYS="key1,key2,key3,key4"
API_TOKEN_SALT=randomsalt123
ADMIN_JWT_SECRET=randomjwt456
TRANSFER_TOKEN_SALT=randomtransfer789
JWT_SECRET=randomsecret000
```

### Step 8: Initialize Database

```bash
cd autobuilder-suite/builder/webstudio

# Generate Prisma client
pnpm --filter=@webstudio-is/prisma-client generate

# Push schema to database
pnpm --filter=@webstudio-is/prisma-client db:push
```

---

## Starting the Services

### With Dev Container

Open VS Code terminal and run:

```bash
# Terminal 1: Webstudio Builder
ws && pnpm dev

# Terminal 2: Strapi CMS (optional)
cms && npm run develop
```

### With Manual Setup

```bash
# Terminal 1: Start PostgreSQL (if not running)
# Windows: Start from Services
# macOS: brew services start postgresql@15
# Linux: sudo systemctl start postgresql

# Terminal 2: Start PostgREST
docker start postgrest
# or: ./postgrest postgrest.conf

# Terminal 3: Start Webstudio
cd autobuilder-suite/builder/webstudio
pnpm dev

# Terminal 4: Start Strapi (optional)
cd cms
npm run develop
```

### Access URLs

| Service | URL |
|---------|-----|
| 🏗️ Webstudio Builder | http://localhost:5173 |
| 📝 Strapi CMS | http://localhost:1337/admin |
| 🔌 PostgREST API | http://localhost:3000 |

---

## First-Time Configuration

### 1. Login to Webstudio

1. Open http://localhost:5173
2. With `DEV_LOGIN=true`, you can login with any email
3. Enter any email (e.g., `admin@local.dev`)

### 2. Setup Strapi Admin

1. Open http://localhost:1337/admin
2. Create your admin account
3. Create an API token:
   - Go to **Settings** → **API Tokens**
   - Click **Create new API Token**
   - Name: `Webstudio`
   - Type: `Full access`
   - Copy the token

### 3. Connect Webstudio to Strapi

Add to your Webstudio `.env`:
```env
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-token-from-step-2
```

Restart Webstudio (`Ctrl+C`, then `pnpm dev`)

---

## Common Issues

### ❌ "Port 5432 already in use"

Another PostgreSQL instance is running.

```bash
# Windows
netstat -ano | findstr :5432
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5432
kill -9 <PID>
```

### ❌ "Cannot connect to database"

1. Check PostgreSQL is running:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Verify credentials:
   ```bash
   psql -U webstudio -d webstudio -h localhost
   ```

### ❌ "pnpm: command not found"

```bash
corepack enable
corepack prepare pnpm@9.14.4 --activate
```

### ❌ "Prisma: Environment variable not found"

Ensure your `.env` file is in the correct location:
```
autobuilder-suite/builder/webstudio/apps/builder/.env
```

### ❌ "PostgREST connection refused"

1. Check PostgREST is running:
   ```bash
   curl http://localhost:3000/
   ```

2. Verify database roles exist:
   ```sql
   SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticator');
   ```

3. Create missing roles:
   ```sql
   CREATE ROLE anon NOLOGIN;
   CREATE ROLE authenticator LOGIN PASSWORD 'password';
   GRANT anon TO authenticator;
   ```

### ❌ Container build fails

```bash
# Clean rebuild
docker-compose -f .devcontainer/docker-compose.yml down -v
docker system prune -f
docker-compose -f .devcontainer/docker-compose.yml build --no-cache
```

---

## 📚 Additional Resources

- [ENV_VARIABLES.md](ENV_VARIABLES.md) - Full environment variable reference
- [.devcontainer/README.md](.devcontainer/README.md) - Dev Container details
- [Webstudio Docs](https://docs.webstudio.is) - Official documentation

---

## 💬 Need Help?

1. Check the [Common Issues](#common-issues) section
2. Search existing GitHub issues
3. Create a new issue with:
   - Your OS and version
   - Node.js version (`node --version`)
   - Full error message
   - Steps to reproduce
