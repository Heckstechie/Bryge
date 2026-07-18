# Vendor Landing Deployment Checklist (bryge.ng)

Use this checklist to publish only the vendor landing page temporarily.

## 0) Preconditions

- [ ] VPS is created with Ubuntu 24.04 LTS
- [ ] You have SSH access: `ssh root@<VPS_IP>`
- [ ] DNS can be edited for `bryge.ng`
- [ ] Repo is pushed and accessible from VPS (GitHub token/key ready)

---

## 1) DNS Setup

- [ ] Create `A` record for `@` -> `<VPS_IP>`
- [ ] Create `A` record for `www` -> `<VPS_IP>`
- [ ] Wait for propagation (can take a few minutes to 1 hour)

Quick check from your local machine:

```bash
nslookup bryge.ng
nslookup www.bryge.ng
```

---

## 2) Initial VPS Hardening + Packages

Run on VPS:

```bash
sudo apt update
sudo apt -y upgrade
sudo apt -y install nginx curl git ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

- [ ] Nginx installed and firewall enabled

---

## 3) Install Node.js LTS (20.x)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs
node -v
npm -v
```

- [ ] Node and npm verified

---

## 4) Pull Project + Build Frontend

```bash
cd /var/www
sudo mkdir -p bryge-src
sudo chown -R $USER:$USER bryge-src
cd bryge-src

# Option A: clone
# git clone <YOUR_REPO_URL> .

# Option B: pull latest if already cloned
# git pull

cd frontend
npm install
npm run build
```

- [ ] Frontend build completed (dist folder exists)

---

## 5) Publish Static Files

```bash
sudo mkdir -p /var/www/bryge
sudo rsync -a --delete /var/www/bryge-src/frontend/dist/ /var/www/bryge/
```

- [ ] `/var/www/bryge/index.html` exists

---

## 6) Configure Nginx (Landing Only)

Create site config:

```bash
sudo nano /etc/nginx/sites-available/bryge
```

Paste:

```nginx
server {
    listen 80;
    server_name bryge.ng www.bryge.ng;

    root /var/www/bryge;
    index index.html;

    # Temporary: force all traffic to vendor landing route
    location = / {
        return 302 /vendor;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/bryge /etc/nginx/sites-enabled/bryge
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

- [ ] Nginx test passes
- [ ] http://bryge.ng opens and redirects to `/vendor`

---

## 7) Enable SSL (HTTPS)

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d bryge.ng -d www.bryge.ng
```

Choose redirect to HTTPS when prompted.

- [ ] https://bryge.ng works
- [ ] Certificate installed

Handover reminder:

- [ ] If a personal email was used for Certbot registration, update certificate contact email to the client-owned address during handover.
- [ ] Confirm client can receive renewal/security notifications for TLS certificates.

---

## 8) Post-Deploy Checks

- [ ] Header, sections, and FAQ render correctly
- [ ] Vendor CTA button opens your temporary form URL
- [ ] Mobile layout looks correct
- [ ] No 404 on refresh at `/vendor`

---

## 9) Fast Re-Deploy (content updates)

After local edits:

```bash
# one-time setup on VPS (from /var/www/bryge-src)
chmod +x scripts/deploy-vendor-landing.sh

# run each time you want to publish latest main
./scripts/deploy-vendor-landing.sh
```

Optional overrides:

```bash
PROJECT_ROOT=/var/www/bryge-src TARGET_DIR=/var/www/bryge BRANCH=main ./scripts/deploy-vendor-landing.sh
```

- [ ] New version visible on domain

---

## 10) Rollback Plan (if needed)

```bash
# keep a backup before each deploy
sudo cp -r /var/www/bryge /var/www/bryge-backup-$(date +%F-%H%M)

# rollback example
sudo rsync -a --delete /var/www/bryge-backup-YYYY-MM-DD-HHMM/ /var/www/bryge/
sudo systemctl reload nginx
```

- [ ] Backup strategy confirmed

---

## 11) When Backend Form Endpoint Is Ready (next phase)

- [ ] Add backend service (Node + PM2)
- [ ] Add `/api` proxy in Nginx to backend port
- [ ] Keep `/` redirect to `/vendor` until full launch

Example proxy block for later:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
