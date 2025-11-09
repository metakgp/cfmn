# Production Server Diagnosis

## Issue

The frontend is getting CORS errors with `status code: (null)` when trying to access `https://cfmn-server.metakgp.org/api`.

**Root Cause:** The production backend server is **not accessible** at all.

```bash
$ curl -I https://cfmn-server.metakgp.org/api
curl: (7) Failed to connect to cfmn-server.metakgp.org port 443: Couldn't connect to server
```

## Possible Causes

### 1. Backend Not Deployed Yet ⚠️ (Most Likely)

The backend container may not be running on the production server.

**Check:**
```bash
# SSH to production server
ssh user@<production-server>

# Check if container is running
docker ps | grep cfmn

# Check docker-compose status
cd /var/www/cfmn  # or your PROJECT_DIR
docker-compose ps
```

**Fix:**
```bash
# Deploy the backend
cd /var/www/cfmn
docker-compose --profile prod up -d

# Or use GitHub Actions to auto-deploy
git push origin main  # Triggers automatic deployment
```

### 2. DNS Not Configured

The domain `cfmn-server.metakgp.org` may not be pointing to the production server.

**Check:**
```bash
# Check DNS resolution
dig cfmn-server.metakgp.org
nslookup cfmn-server.metakgp.org

# Check if it points to the right server IP
ping cfmn-server.metakgp.org
```

**Fix:**
Contact MetaKGP infrastructure team to configure DNS A record pointing to the production server IP.

### 3. Nginx Not Configured

The Nginx reverse proxy may not be set up to route traffic to the backend.

**Check:**
```bash
# SSH to production server
ssh user@<production-server>

# Check if nginx is running
systemctl status nginx
# or
docker ps | grep nginx

# Check nginx configuration
cat /etc/nginx/sites-enabled/cfmn-server.metakgp.org
# or for metaploy setup
cat /path/to/nginx/config/cfmn.metaploy.conf
```

**Expected Nginx Config:**
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name cfmn-server.metakgp.org;

    # SSL configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location /api {
        proxy_pass http://localhost:8085;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Fix:**
- Ensure nginx configuration is in place
- Restart nginx: `sudo systemctl restart nginx` or `docker restart nginx`
- Check for metaploy integration (config might be in `metaploy/cfmn.metaploy.conf`)

### 4. Firewall Blocking Traffic

Server firewall may be blocking incoming connections.

**Check:**
```bash
# Check firewall rules
sudo ufw status
# or
sudo iptables -L

# Check if ports 80 and 443 are open
sudo netstat -tlnp | grep -E ':(80|443)'
```

**Fix:**
```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### 5. SSL/HTTPS Not Configured

The server may not have SSL certificates for HTTPS.

**Check:**
```bash
# Try HTTP instead
curl -I http://cfmn-server.metakgp.org/api

# Check SSL certificate
openssl s_client -connect cfmn-server.metakgp.org:443 -servername cfmn-server.metakgp.org
```

**Fix:**
- Use Let's Encrypt to get free SSL certificate
- Or check if MetaKGP has a wildcard certificate for `*.metakgp.org`

## Quick Deployment Steps

If the backend hasn't been deployed yet, follow these steps:

### Option 1: Automatic Deployment (via GitHub Actions)

1. **Ensure GitHub Secrets are configured** (see DEPLOYMENT.md)

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **Monitor GitHub Actions:**
   - Go to repository → Actions tab
   - Watch the deployment workflow
   - Wait for all stages to complete

4. **Verify deployment:**
   ```bash
   # Should return 200 OK
   curl -I https://cfmn-server.metakgp.org/api
   ```

### Option 2: Manual Deployment

1. **SSH to production server:**
   ```bash
   ssh user@<production-server-ip>
   ```

2. **Clone repository (first time only):**
   ```bash
   cd /var/www  # or your preferred directory
   git clone https://github.com/metakgp/cfmn.git
   cd cfmn
   ```

3. **Configure environment:**
   ```bash
   cp .production.env.template .production.env
   nano .production.env  # Fill in actual values
   ```

4. **Pull latest code:**
   ```bash
   git pull origin main
   ```

5. **Run database migrations:**
   ```bash
   cd backend
   export DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>"
   sqlx migrate run
   cd ..
   ```

6. **Deploy with docker-compose:**
   ```bash
   docker-compose pull
   docker-compose --profile prod up -d
   ```

7. **Check logs:**
   ```bash
   docker logs -f cfmn-backend
   ```

   Expected output:
   ```
   INFO backend: Database connection established.
   INFO backend: Server listening on 0.0.0.0:8085
   ```

8. **Verify locally on server:**
   ```bash
   curl http://localhost:8085/api
   # Should return: "Welcome to the API"
   ```

9. **Configure Nginx** (if not using metaploy):
   ```bash
   sudo nano /etc/nginx/sites-available/cfmn-server.metakgp.org
   # Add nginx configuration (see above)

   sudo ln -s /etc/nginx/sites-available/cfmn-server.metakgp.org /etc/nginx/sites-enabled/
   sudo nginx -t  # Test configuration
   sudo systemctl restart nginx
   ```

10. **Test from outside:**
    ```bash
    curl -I https://cfmn-server.metakgp.org/api
    # Should return 200 OK with CORS headers
    ```

## MetaKGP Specific Setup

If using MetaKGP's infrastructure with metaploy:

1. **Check metaploy configuration:**
   ```bash
   cat metaploy/cfmn.metaploy.conf
   ```

2. **Ensure metaploy postinstall runs:**
   ```bash
   cat metaploy/postinstall.sh
   ```
   This should copy nginx config to the right location.

3. **Check metaploy network:**
   ```bash
   docker network ls | grep metaploy
   ```

4. **Verify container is on metaploy network:**
   ```bash
   docker inspect cfmn-backend | grep -A 10 Networks
   ```

## Verification Checklist

After deployment, verify these items:

- [ ] DNS resolves to production server IP
- [ ] Port 443 is open and accessible
- [ ] Backend container is running: `docker ps | grep cfmn-backend`
- [ ] Backend responds locally: `curl http://localhost:8085/api`
- [ ] Nginx is running and configured
- [ ] SSL certificate is valid
- [ ] Backend is accessible externally: `curl https://cfmn-server.metakgp.org/api`
- [ ] CORS headers are present in response
- [ ] Frontend can reach backend API

## Contact

If you need help with MetaKGP infrastructure:
- MetaKGP Slack/Discord
- GitHub Issues: https://github.com/metakgp/cfmn/issues

---

**Created:** 2025-11-09
**Issue:** Production backend not accessible
**Status:** Awaiting deployment
