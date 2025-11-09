# Deployment Checklist

## Pre-Deployment

### Code Changes
- [ ] All tests passing locally
- [ ] SQLx offline data updated: `cd backend && cargo sqlx prepare`
- [ ] All changes committed and pushed to `main`
- [ ] Database migrations tested locally

### Environment Setup
- [ ] GitHub Secrets configured:
  - [ ] `DOCKERHUB_USERNAME`
  - [ ] `DOCKERHUB_PASSWORD`
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `SSH_HOSTNAME`
  - [ ] `SSH_USERNAME`
  - [ ] `SSH_PRIVATE_KEY`
  - [ ] `SSH_PRIVATE_KEY_PASSPHRASE` (if needed)
- [ ] GitHub Variables configured:
  - [ ] `PROJECT_DIR`
- [ ] Production `.production.env` file created and configured on server

### Database
- [ ] Production database accessible
- [ ] All migrations ready in `backend/migrations/`
- [ ] Migrations tested on staging/dev database
- [ ] Database backup taken (if updating existing deployment)

## Deployment

### Automatic (via GitHub Actions)
- [ ] Push to `main` branch
- [ ] Monitor GitHub Actions workflow
- [ ] Wait for all stages to complete (dockerhub → push → pull → deploy)

### Manual (if needed)
- [ ] Set environment variables: `GOOGLE_CLIENT_ID`, `DOCKERHUB_USERNAME`, `DOCKERHUB_PASSWORD`
- [ ] Run `./docker-push.sh`
- [ ] SSH to production server
- [ ] Navigate to project directory
- [ ] Pull latest code: `git pull origin main`
- [ ] Pull Docker image: `docker-compose pull`
- [ ] Stop services: `docker-compose down`
- [ ] Start services: `docker-compose --profile prod up -d`

### Database Migrations
- [ ] SSH to production server
- [ ] Run migrations: `cd backend && sqlx migrate run`
- [ ] Verify migration success: `sqlx migrate info`

## Post-Deployment Verification

### Service Health
- [ ] Backend container running: `docker ps | grep cfmn-backend`
- [ ] No errors in logs: `docker logs cfmn-backend | grep -i error`
- [ ] Database connection successful (check logs)
- [ ] Server listening on port 8085 (check logs)

### API Testing
- [ ] Root endpoint: `curl https://cfmn-server.metakgp.org/api`
- [ ] Notes listing: `curl https://cfmn-server.metakgp.org/api/notes?num=5`
- [ ] Search: `curl https://cfmn-server.metakgp.org/api/notes/search?query=test`
- [ ] Leaderboard: `curl https://cfmn-server.metakgp.org/api/users/leaderboard?limit=10`
- [ ] CORS headers present in response

### Frontend Testing
- [ ] Frontend loads without errors
- [ ] Google OAuth login works
- [ ] Notes display correctly
- [ ] Search functionality works
- [ ] Upload notes (test with small PDF)
- [ ] Vote on notes
- [ ] Leaderboard page displays
- [ ] Download notes works

### Performance
- [ ] Response times acceptable (< 500ms for most endpoints)
- [ ] No memory leaks: `docker stats cfmn-backend`
- [ ] Disk space sufficient: `docker exec cfmn-backend df -h`

## Rollback (if needed)

- [ ] Identify last working commit
- [ ] SSH to production server
- [ ] Reset to previous commit: `git reset --hard <commit-hash>`
- [ ] Pull previous Docker image
- [ ] Restart services: `docker-compose down && docker-compose --profile prod up -d`
- [ ] Verify rollback successful
- [ ] Revert database migrations if needed: `sqlx migrate revert`

## Documentation

- [ ] Update CHANGELOG.md (if exists)
- [ ] Document any configuration changes
- [ ] Update README.md if needed
- [ ] Notify team of deployment

## Monitoring (First 24 Hours)

- [ ] Monitor error logs periodically
- [ ] Check resource usage (CPU, memory, disk)
- [ ] Verify no unusual traffic patterns
- [ ] Monitor user feedback/reports

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Deployment Type:** [ ] Automatic  [ ] Manual

**Issues Encountered:**
_______________________________________________
_______________________________________________

**Resolution:**
_______________________________________________
_______________________________________________

**Sign-off:** _______________
