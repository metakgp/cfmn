# CFMN Deployment Guide

## Overview

This guide covers deploying the CFMN (Can't Find My Notes) application to production using Docker and GitHub Actions.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              GitHub Actions CI/CD                │
│  (Auto-deploy on push to main)                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│          Docker Hub: metakgporg/cfmn-backend    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│         Production Server (MetaKGP)             │
│  - Nginx reverse proxy                          │
│  - Backend container (port 8085)                │
│  - PostgreSQL (external)                        │
│  - Odin's Vault (static files)                  │
└─────────────────────────────────────────────────┘
```

## Pre-Deployment Checklist

### 1. Code Preparation

- [x] **SQLx Offline Mode Updated**
  ```bash
  cd backend
  cargo sqlx prepare --workspace
  git add .sqlx/
  git commit -m "chore: update SQLx offline mode data"
  ```

- [x] **Production Environment Template Verified**
  - File: `.production.env.template`
  - LOG_LOCATION set to file path (not directory)
  - All required variables documented

- [ ] **Database Migrations Ready**
  - All migrations in `backend/migrations/` are tested
  - Migration files committed to repository

### 2. Environment Configuration

Create `.production.env` on the production server with these variables:

```bash
# Authentication
GOOGLE_CLIENT_ID=<production-client-id>
SIGNING_SECRET=<secure-random-secret>
EXPIRATION_TIME_SECONDS="86400"

# Application
FILE_SIZE_LIMIT="50"
PORT=8085
FRONTEND_BUILD_DIR=../frontend/dist/

# Database
DB_NAME=<production-db-name>
DB_HOST=<postgres-host>
DB_PORT=<postgres-port>
DB_USER=<postgres-user>
DB_PASSWORD=<postgres-password>
SQLX_OFFLINE=true

# File Storage
UPLOADED_NOTES_PATH=cfmn/notes/uploaded
PREVIEWS_PATH=cfmn/previews/uploaded
STATIC_FILES_URL=http://static.metakgp.org
LOG_LOCATION=/app/log/backend.log
STATIC_FILE_STORAGE_LOCATION=/app/static_files
```

### 3. GitHub Secrets Configuration

Required secrets in GitHub repository settings:

- `DOCKERHUB_USERNAME` - Docker Hub username (e.g., metakgporg)
- `DOCKERHUB_PASSWORD` - Docker Hub password or access token
- `GOOGLE_CLIENT_ID` - Production Google OAuth client ID
- `SSH_HOSTNAME` - Production server hostname/IP
- `SSH_USERNAME` - SSH username for deployment
- `SSH_PRIVATE_KEY` - SSH private key for authentication
- `SSH_PRIVATE_KEY_PASSPHRASE` - Passphrase for SSH key (if applicable)

Required variables:

- `PROJECT_DIR` - Project directory on production server (e.g., `/var/www/cfmn`)

### 4. Production Server Setup

#### 4.1 Install Prerequisites

```bash
# Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install docker-compose if not present
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 4.2 Clone Repository

```bash
cd /var/www  # or your preferred directory
git clone https://github.com/metakgp/cfmn.git
cd cfmn
```

#### 4.3 Configure Environment

```bash
# Create production environment file
cp .production.env.template .production.env
nano .production.env  # Fill in actual values
```

#### 4.4 Setup Database

```bash
# Option 1: Use existing MetaKGP PostgreSQL
# Ensure DATABASE_URL is configured in .production.env

# Option 2: Run local PostgreSQL (not recommended for production)
docker-compose -f docker-compose.dev.yml up -d
```

#### 4.5 Run Migrations

```bash
# Install sqlx-cli on production server
cargo install sqlx-cli --no-default-features --features postgres

# Run migrations
cd backend
export DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>"
sqlx migrate run
```

## Deployment Methods

### Method 1: Automatic Deployment (Recommended)

Deployment happens automatically via GitHub Actions when you push to `main`:

```bash
# Make your changes
git add .
git commit -m "feat: your changes"
git push origin main

# GitHub Actions will:
# 1. Build Docker image
# 2. Push to Docker Hub
# 3. SSH to production server
# 4. Pull latest code
# 5. Pull latest Docker image
# 6. Restart containers
```

**Triggers:**
- Push to `main` branch
- Changes to `backend/**`, `.github/workflows/deploy.yaml`, `docker-compose.yml`, `Dockerfile`, or `metaploy/**`

### Method 2: Manual Deployment

#### Build and Push Docker Image

```bash
# Set environment variables
export GOOGLE_CLIENT_ID=<production-client-id>
export DOCKERHUB_USERNAME=metakgporg
export DOCKERHUB_PASSWORD=<password>

# Run build script
./docker-push.sh
```

#### Deploy on Production Server

```bash
# SSH to production server
ssh user@production-server

# Navigate to project directory
cd /var/www/cfmn

# Pull latest code
git pull origin main

# Pull latest Docker image
docker-compose pull

# Restart services
docker-compose down
docker-compose --profile prod up -d

# Verify deployment
docker-compose logs -f backend
```

## Post-Deployment Verification

### 1. Check Service Status

```bash
# Check running containers
docker ps | grep cfmn

# Check logs
docker-compose logs -f backend

# Expected output:
# INFO backend: Database connection established.
# INFO backend: Server listening on 0.0.0.0:8085
```

### 2. Test API Endpoints

```bash
# Test root endpoint
curl https://cfmn-server.metakgp.org/api

# Test notes endpoint
curl https://cfmn-server.metakgp.org/api/notes?num=5

# Test leaderboard endpoint
curl https://cfmn-server.metakgp.org/api/users/leaderboard?limit=10

# Test CORS headers
curl -I -X OPTIONS https://cfmn-server.metakgp.org/api/notes \
  -H "Origin: https://cfmn.metakgp.org" \
  -H "Access-Control-Request-Method: GET"
```

### 3. Frontend Verification

- Visit `https://cfmn.metakgp.org` (or your frontend URL)
- Test Google OAuth login
- Upload a test note
- Search for notes
- Vote on notes
- Check leaderboard page
- Test note download

### 4. Monitor Logs

```bash
# Follow backend logs
docker logs -f cfmn-backend

# Check for errors
docker logs cfmn-backend | grep -i error

# View database logs (if using Docker DB)
docker logs -f cfmn-dev-db
```

## Rollback Procedure

If deployment fails, rollback to previous version:

```bash
# SSH to production server
ssh user@production-server
cd /var/www/cfmn

# Revert to previous commit
git log --oneline -5  # Find previous commit hash
git reset --hard <previous-commit-hash>

# Pull previous Docker image
docker pull metakgporg/cfmn-backend:latest

# Restart services
docker-compose down
docker-compose --profile prod up -d
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs cfmn-backend

# Common issues:
# 1. Environment variables not set
docker exec cfmn-backend env | grep DB_

# 2. Database connection failed
docker exec cfmn-backend ping <db-host>

# 3. Port already in use
lsof -i :8085
```

### CORS Errors

**Current Setup:** Liberal CORS (allows all origins)

```rust
// backend/src/main.rs
let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods(Any)
    .allow_headers(Any)
    .expose_headers(Any);
```

**For Production Security (Future):**
Update `backend/src/main.rs` to restrict origins:

```rust
use tower_http::cors::AllowOrigin;

let cors = CorsLayer::new()
    .allow_origin(AllowOrigin::exact("https://cfmn.metakgp.org".parse().unwrap()))
    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
    .allow_headers([
        HeaderName::from_static("content-type"),
        HeaderName::from_static("authorization"),
    ])
    .allow_credentials(true);
```

### Database Migration Issues

```bash
# Check migration status
cd backend
export DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>"
sqlx migrate info

# Revert last migration if needed
sqlx migrate revert

# Re-run migrations
sqlx migrate run
```

### File Upload Issues

```bash
# Check permissions on static files directory
docker exec cfmn-backend ls -la /app/static_files

# Check disk space
docker exec cfmn-backend df -h

# Check poppler-utils (PDF processing)
docker exec cfmn-backend which pdftoppm
```

## Performance Monitoring

### Resource Usage

```bash
# Container stats
docker stats cfmn-backend

# Disk usage
docker exec cfmn-backend du -sh /app/static_files/*

# Memory usage
docker exec cfmn-backend free -h
```

### Database Queries

```bash
# Monitor slow queries (if you have PostgreSQL access)
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Maintenance

### Regular Tasks

**Weekly:**
- Check disk space
- Review application logs
- Monitor error rates

**Monthly:**
- Update dependencies
- Review and clean old logs
- Database backup verification

**As Needed:**
- Security updates
- Feature deployments
- Database migrations

### Backup Strategy

**Database Backups:**
```bash
# Backup database
pg_dump -h <db-host> -U <db-user> <db-name> > backup-$(date +%Y%m%d).sql

# Restore database
psql -h <db-host> -U <db-user> <db-name> < backup-20250101.sql
```

**Static Files Backup:**
```bash
# Backup uploaded files (from Odin's Vault)
tar -czf cfmn-files-$(date +%Y%m%d).tar.gz /app/static_files/cfmn/
```

## Security Considerations

### Current Status

- ✅ HTTPS via Nginx reverse proxy
- ✅ Google OAuth authentication
- ✅ JWT token-based sessions
- ✅ File upload validation (PDF only, size limits)
- ⚠️ Liberal CORS (allows all origins - acceptable for now)
- ✅ SQL injection protection (SQLx prepared statements)

### Recommended Future Improvements

1. **CORS Restriction:** Update to allow only specific origins
2. **Rate Limiting:** Add rate limiting to prevent abuse
3. **Input Validation:** Enhanced validation on all endpoints
4. **Security Headers:** Add security headers (CSP, HSTS, etc.)
5. **Secrets Rotation:** Regular rotation of signing secrets
6. **Monitoring:** Setup error tracking (Sentry, etc.)

## CI/CD Pipeline Details

### GitHub Actions Workflow

**File:** `.github/workflows/deploy.yaml`

**Stages:**

1. **dockerhub** - Build and push Docker image
   - Multi-platform build (linux/amd64)
   - Layer caching for faster builds
   - Pushes to `metakgporg/cfmn-backend:latest`

2. **push** - Sync code to production server
   - SSH to server
   - Git pull latest changes
   - Hard reset to origin/main

3. **pull** - Pull Docker image
   - SSH to server
   - Run `docker compose pull`

4. **deploy** - Deploy application
   - Stop existing containers
   - Start new containers with `--profile prod`

### Deployment Timing

Average deployment time: **5-8 minutes**
- Docker build: 3-5 minutes
- Code sync: 10-20 seconds
- Image pull: 30-60 seconds
- Container restart: 10-20 seconds

## Support and Contacts

**Repository:** https://github.com/metakgp/cfmn

**Issues:** https://github.com/metakgp/cfmn/issues

**MetaKGP:** https://metakgp.org

---

## Quick Reference Commands

```bash
# View logs
docker logs -f cfmn-backend

# Restart backend
docker-compose restart backend

# Stop all services
docker-compose down

# Start all services
docker-compose --profile prod up -d

# Check service status
docker-compose ps

# Run migrations
cd backend && sqlx migrate run

# Test API
curl https://cfmn-server.metakgp.org/api

# View environment
docker exec cfmn-backend env

# Access container shell
docker exec -it cfmn-backend sh
```

---

**Last Updated:** 2025-11-09
**Version:** 1.0.0
