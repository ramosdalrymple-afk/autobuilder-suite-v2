# 🐳 Development Container Setup

> One-click development environment for ABS (AutoBuilder Suite)

## 🚀 Quick Start

### Prerequisites

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
2. [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Start the Environment

**Option 1: VS Code (Recommended)**

1. Clone the repository:
   ```bash
   git clone https://github.com/ramosdalrymple-afk/autobuilder-suitev2.git
   cd autobuilder-suitev2
   ```

2. Open in VS Code:
   ```bash
   code .
   ```

3. When prompted, click **"Reopen in Container"**
   
   Or press `F1` → `Dev Containers: Reopen in Container`

4. Wait for the container to build and dependencies to install (~5-10 minutes first time)

**Option 2: Command Line**

```bash
# Clone and enter directory
git clone https://github.com/ramosdalrymple-afk/autobuilder-suitev2.git
cd autobuilder-suitev2

# Build and start containers
docker-compose -f .devcontainer/docker-compose.yml up -d

# Attach to dev container
docker exec -it abs-dev zsh
```

---

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Webstudio Builder | http://localhost:5173 | Visual website builder |
| Strapi CMS | http://localhost:1337 | Content management |
| PostgREST API | http://localhost:3000 | Database REST API |
| Storybook | http://localhost:6006 | Component library |

---

## 📋 Quick Commands

Inside the container terminal:

```bash
# Navigation shortcuts
ws              # Go to Webstudio directory
cms             # Go to CMS directory

# Start Webstudio Builder
ws && pnpm dev

# Start Strapi CMS  
cms && npm run develop

# Start Storybook
ws && pnpm storybook:dev

# Run tests
ws && pnpm test

# Run linting
ws && pnpm lint

# Database operations
ws && pnpm migrations         # Run Prisma migrations
ws && pnpm prisma studio      # Open Prisma Studio
```

---

## 📁 Directory Structure

```
/workspace/
├── .devcontainer/           # Container configuration
│   ├── devcontainer.json    # VS Code dev container config
│   ├── docker-compose.yml   # Service orchestration
│   ├── Dockerfile           # Main dev container
│   └── Dockerfile.strapi    # Strapi container
├── autobuilder-suite/
│   └── builder/
│       └── webstudio/       # Webstudio Builder (pnpm)
├── cms/                     # Strapi CMS (npm)
└── docs/                    # Documentation
```

---

## 🔧 Troubleshooting

### Container won't start

```bash
# Rebuild from scratch
docker-compose -f .devcontainer/docker-compose.yml down -v
docker-compose -f .devcontainer/docker-compose.yml build --no-cache
docker-compose -f .devcontainer/docker-compose.yml up -d
```

### Database connection issues

```bash
# Check PostgreSQL is running
docker logs abs-postgres

# Connect to PostgreSQL directly
docker exec -it abs-postgres psql -U webstudio -d webstudio
```

### pnpm install fails

```bash
# Clear pnpm cache and reinstall
pnpm store prune
cd /workspace/autobuilder-suite/builder/webstudio
rm -rf node_modules
pnpm install
```

### Ports already in use

```bash
# On Windows, find and kill process on port
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :5173
kill -9 <PID>
```

---

## 🛠️ VS Code Extensions (Auto-installed)

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Prisma** - Database schema syntax
- **PostgreSQL** - Database management
- **Docker** - Container management
- **GitLens** - Git supercharged
- **Thunder Client** - API testing

---

## 🔐 Environment Variables

Environment variables are pre-configured in the container. See [ENV_VARIABLES.md](../ENV_VARIABLES.md) for full reference.

---

## 🧹 Cleanup

```bash
# Stop all containers
docker-compose -f .devcontainer/docker-compose.yml down

# Remove containers and volumes (fresh start)
docker-compose -f .devcontainer/docker-compose.yml down -v

# Remove all ABS images
docker rmi $(docker images | grep abs | awk '{print $3}')
```
