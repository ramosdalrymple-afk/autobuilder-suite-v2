# ⚠️ One-Click Launcher - Issues & Fixes

## 🔍 Issues Found

### **Issue 1: Default AUTH_SECRET is Weak**
**Location**: `.devcontainer/scripts/post-create.sh` (line 49)
**Severity**: 🔴 CRITICAL

```bash
# CURRENT (INSECURE)
AUTH_SECRET=dev-secret-key
```

**Problem**:
- The secret is hardcoded in setup scripts
- Only 14 characters (should be 32+)
- Anyone running the setup script can see it
- Same secret in all development environments

---

### **Issue 2: Docker Compose Missing Initialization**
**Location**: `autobuilder-suite/builder/docker-compose.yml`
**Severity**: 🟠 HIGH

**Problem**:
- Missing database initialization scripts volume
- No health checks for PostgREST
- PostgREST starts without waiting for database fully initialized
- Can cause "fetch failed" errors on first run

**Current**:
```yaml
postgrest:
  depends_on:
    postgres:
      condition: service_healthy  # ✅ Good
```

**Missing**:
- No healthcheck for PostgREST itself
- Init scripts not mounted in this compose file

---

### **Issue 3: PostgREST URL Mismatch**
**Location**: Multiple files
**Severity**: 🟠 MEDIUM

**Files with inconsistencies**:
- `.devcontainer/docker-compose.yml`: `POSTGREST_URL=http://postgrest:3000`
- `.env`: `POSTGREST_URL=http://localhost:3000` (local)
- `autobuilder-suite/builder/docker-compose.yml`: Local setup

**Problem**: When running locally (not in container), PostgREST must be accessible at `localhost:3000`. If you try to use `postgrest:3000`, it fails with **ECONNREFUSED**.

---

### **Issue 4: Missing pnpm Store Configuration**
**Location**: `.devcontainer/scripts/post-create.sh` (line 17)
**Severity**: 🟡 MEDIUM

```bash
# Might not persist across restarts
pnpm config set store-dir /home/node/.local/share/pnpm/store
```

**Problem**:
- Store configuration may not persist if volume mapping is incorrect
- Dependencies can fail to download if storage is full

---

### **Issue 5: No Error Handling in Post-Create Script**
**Location**: `.devcontainer/scripts/post-create.sh`
**Severity**: 🟡 MEDIUM

```bash
# CURRENT
pnpm install --frozen-lockfile || pnpm install  # ❌ Silent fallback
pnpm --filter=@webstudio-is/prisma-client db:push || true  # ❌ Ignores errors
npm install  # ❌ No error checking
```

**Problem**:
- Errors are silently ignored
- Installation failures not reported
- Second pnpm install is redundant

---

## 🛠️ Fixes Applied

### **Fix 1: Update Docker Compose with Health Checks**

File: `autobuilder-suite/builder/docker-compose.yml`

```yaml
postgrest:
  # ... existing config
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
```

---

### **Fix 2: Update Post-Create Script with Better Error Handling**

File: `.devcontainer/scripts/post-create.sh`

```bash
#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

handle_error() {
    echo "❌ Setup failed at line $1"
    exit 1
}
trap 'handle_error $LINENO' ERR

# ... rest of script with proper error checking
```

---

### **Fix 3: Generate Secure AUTH_SECRET**

For development, use:
```bash
# Windows PowerShell
[Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# macOS/Linux
openssl rand -hex 32
```

Then update in `.env` and docker-compose files.

---

### **Fix 4: Add Init Scripts to Docker Compose**

```yaml
postgres:
  volumes:
    - db_data:/var/lib/postgresql/data
    - ./init-scripts:/docker-entrypoint-initdb.d:ro  # ✅ Add this
```

---

## 📋 Environment Variable Consistency

| Variable | Current | Should Be | Environment |
|----------|---------|-----------|-------------|
| `POSTGREST_URL` | `http://localhost:3000` | `http://postgrest:3000` | Container |
| `POSTGREST_URL` | `http://localhost:3000` | `http://localhost:3000` | Local |
| `AUTH_SECRET` | `dev-secret-key` | `<32-char random>` | All |
| `DEV_LOGIN` | `true` | `true` (dev only) | Development |

---

## ✅ Recommended Changes

### 1. **Update `.env` file**
```diff
- DEV_LOGIN=true
- AUTH_SECRET=secret
+ DEV_LOGIN=true
+ AUTH_SECRET=<generated-secure-secret>
```

### 2. **Update `.devcontainer/scripts/post-create.sh`**
```bash
#!/bin/bash
set -euo pipefail

# Better error handling
handle_error() {
    echo "❌ ERROR at line $1"
    exit 1
}
trap 'handle_error $LINENO' ERR

# Use exit codes properly
if ! pnpm install --frozen-lockfile 2>/dev/null; then
    echo "⚠️ Frozen lockfile install failed, trying regular install..."
    pnpm install || handle_error $LINENO
fi
```

### 3. **Add healthcheck to docker-compose**
```yaml
postgrest:
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### 4. **Fix POSTGREST_URL in different environments**
- **Container**: `http://postgrest:3000`
- **Local**: `http://localhost:3000`

---

## 🚀 Quick Fix Checklist

- [ ] Generate new `AUTH_SECRET` (32 characters)
- [ ] Update `.env` with new secret
- [ ] Update `docker-compose.yml` with health checks
- [ ] Test container startup: `docker-compose up -d`
- [ ] Verify all services running: `docker-compose ps`
- [ ] Test login page loads without errors
- [ ] Verify "Login with Secret" button appears

---

## 📊 Current Status

| Component | Status | Issue |
|-----------|--------|-------|
| Docker Compose | ⚠️ Works but fragile | Missing health checks |
| Post-Create Script | ⚠️ Works but errors ignored | Error handling |
| ENV Variables | 🔴 Critical | Weak secrets hardcoded |
| Init Scripts | ✅ OK | Properly mounted |
| PostgreSQL | ✅ OK | Working |
| PostgREST | ⚠️ Intermittent | Connection timing |
| Login Page | 🔴 Fails | Backend unreachable |

