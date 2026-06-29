# Medhashree — Production Deployment & Server Configuration Guide

This document provides a step-by-step guide to deploying the Medhashree platform on a production server (Ubuntu/Debian VPS) with maximum security, performance, and SEO.

---

## 🏗️ Deployment Architecture

Medhashree is split into two parts:
1. **Frontend (React + Vite)**: Built into static HTML/JS/CSS assets. Can be served by Nginx on your server or deployed to Cloudflare Pages (highly recommended).
2. **Backend (Node.js + Express + Socket.io)**: Runs as a persistent server process on port `5000` (managed by PM2 or Docker) and interacts with a **PostgreSQL** database.

```
                  ┌───────────────────────┐
                  │      User Browser     │
                  └───────────┬───────────┘
                              │ HTTPS
                              ▼
                  ┌───────────────────────┐
                  │   Nginx Reverse Proxy │
                  └──────┬─────────┬──────┘
            Static HTML/ │         │ /api & /socket.io
            CSS/JS Files │         │ (Proxy Pass)
                         ▼         ▼
             ┌──────────────┐   ┌──────────────────────┐
             │ Static Build │   │ Node.js Server (5000)│
             │   (/dist)    │   └──────────┬───────────┘
             └──────────────┘              │ PostgreSQL
                                           ▼
                                ┌──────────────────────┐
                                │      PostgreSQL      │
                                └──────────────────────┘
```

---

## 📋 Table of Contents
1. [Prerequisites & System Updates](#1-prerequisites--system-updates)
2. [Database Setup (PostgreSQL)](#2-database-setup-postgresql)
3. [Backend Setup (PM2 & Node.js)](#3-backend-setup-pm2--nodejs)
4. [Frontend Build & Static Files](#4-frontend-build--static-files)
5. [Nginx Web Server Configuration](#5-nginx-web-server-configuration)
6. [SSL/TLS Certificate Setup (HTTPS)](#6-ssltls-certificate-setup-https)
7. [Docker & Docker Compose Deployment (Alternative)](#7-docker--docker-compose-deployment-alternative)
8. [Google Analytics, Clarity & OAuth Setup](#8-google-analytics-clarity--oauth-setup)
9. [Google Search Console & SEO Configuration](#9-google-search-console--seo-configuration)
10. [Useful Server Commands Cheatsheet](#10-useful-server-commands-cheatsheet)

---

## 1. Prerequisites & System Updates

Connect to your server via SSH:
```bash
ssh username@your_server_ip
```

Update packages to ensure system libraries are up to date:
```bash
sudo apt update && sudo apt upgrade -y
```

Install common utility tools:
```bash
sudo apt install curl git wget build-essential unzip -y
```

Install **Node.js LTS (v20)** and **npm**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installations:
```bash
node -v
npm -v
```

---

## 2. Database Setup (PostgreSQL)

Install PostgreSQL and its contrib libraries:
```bash
sudo apt install postgresql postgresql-contrib -y
```

Ensure the PostgreSQL service is active and runs on startup:
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Log in as the default Postgres user:
```bash
sudo -i -u postgres
```

Access the PostgreSQL command line shell:
```sql
psql
```

Run these SQL queries to create your database, user, and assign permissions (replace `your_strong_password` with a secure key):
```sql
CREATE DATABASE medhashree;
CREATE USER medha_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE medhashree TO medha_user;
ALTER DATABASE medhashree OWNER TO medha_user;
\q
```

Return to your normal shell:
```bash
exit
```

---

## 3. Backend Setup (PM2 & Node.js)

Clone your repository to the server (e.g., in `/var/www/`):
```bash
sudo mkdir -p /var/www/medhashree
sudo chown -R $USER:$USER /var/www/medhashree
cd /var/www/medhashree
# Clone or upload your files here. If uploading directly:
# cp -r /path/to/project/* /var/www/medhashree/
```

Navigate to the `backend` folder and install production dependencies:
```bash
cd /var/www/medhashree/backend
npm ci --only=production
```

Install **helmet** and **express-rate-limit** (crucial for security):
```bash
npm install helmet express-rate-limit --save
```

Create a production `.env` file for the backend:
```bash
nano .env
```

Paste and configure the variables (replace with your actual server configuration):
```env
PORT=5000
NODE_ENV=production

# Database Connection (usesSupabase/Neon/Self-Hosted Postgres)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=medha_user
DB_PASSWORD=your_strong_password
DB_NAME=medhashree
DB_SSL=false

# Security
JWT_SECRET=generate_a_very_long_random_hex_string_here

# CORS / Socket Origin Whitelist
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com

# Email Settings (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```
*Press `CTRL+O` to save and `CTRL+X` to exit.*

Install **PM2** globally to manage your Node process:
```bash
sudo npm install -p pm2 -g
```

Start the server using PM2 (runs in the background and auto-restarts on crash):
```bash
pm2 start server.js --name "medhashree-backend"
```

Save the process list and configure PM2 to start automatically on server boot:
```bash
pm2 save
pm2 startup
# Copy and paste the command output by 'pm2 startup' to complete system integration
```

Check the logs to verify everything is running:
```bash
pm2 logs medhashree-backend
```

---

## 4. Frontend Build & Static Files

Navigate to the `frontend` folder:
```bash
cd /var/www/medhashree/frontend
```

Install dependencies:
```bash
npm install
```

Create a production `.env.production` file:
```bash
nano .env.production
```

Paste your configuration:
```env
VITE_API_URL=https://yourdomain.com
VITE_GOOGLE_CLIENT_ID=your_google_auth_client_id.apps.googleusercontent.com
VITE_SITE_URL=https://yourdomain.com

# Optional Analytics Integration IDs
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_CLARITY_ID=your_clarity_project_id
```

Run the build command:
```bash
npm run build
```
This generates optimized, minified static files in the `/var/www/medhashree/frontend/dist` directory.

---

## 5. Nginx Web Server Configuration

Nginx is the web server that serves frontend static files directly and acts as a secure reverse proxy for backend APIs and WebSockets.

Install Nginx:
```bash
sudo apt install nginx -y
```

Ensure Nginx is running and enabled on boot:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

Create a new configuration block for Medhashree:
```bash
sudo nano /etc/nginx/sites-available/medhashree
```

Paste the following configurations (be sure to replace `yourdomain.com` with your real domain):
```nginx
# HTTP configuration (Redirect to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    return 301 https://$host$request_uri;
}

# Main HTTPS server configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (managed by Let's Encrypt Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Static assets root folder
    root /var/www/medhashree/frontend/dist;
    index index.html;

    # Max upload limit for custom quiz CSV files
    client_max_body_size 15M;

    # ─── Security Headers ───
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # ─── Gzip Compression ───
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # ─── Core SEO files served directly ───
    location = /robots.txt {
        try_files $uri =404;
        access_log off;
    }

    location = /sitemap.xml {
        try_files $uri =404;
        access_log off;
    }

    # ─── Long-term Browser Caching for Hashed Assets ───
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ─── Backend API Proxy ───
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ─── Real-time WebSockets (Socket.IO) Proxy ───
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ─── Static Uploads Proxy ───
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }

    # ─── Single Page Application (SPA) routing fallback ───
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the configuration by creating a symlink in the `sites-enabled` folder:
```bash
sudo ln -s /etc/nginx/sites-available/medhashree /etc/nginx/sites-enabled/
```

Remove the default site config if present to avoid conflicts:
```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

Test your configuration for syntax errors:
```bash
sudo nginx -t
```

If it shows "syntax is ok", reload Nginx to apply changes:
```bash
sudo systemctl reload nginx
```

---

## 6. SSL/TLS Certificate Setup (HTTPS)

HTTPS is mandatory to secure JWT authorization tokens and is highly weighted by Google's search crawlers for SEO ranking.

Install **Certbot** and the Nginx plugin:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

Obtain and configure your free SSL/TLS certificate (replace with your domain):
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
*Choose the options to redirect all traffic to HTTPS when prompted.*

Test the auto-renewal schedule to verify certificates won't expire:
```bash
sudo certbot renew --dry-run
```

---

## 7. Docker & Docker Compose Deployment (Alternative)

If you prefer deploying the backend isolated in a Docker container:

Install Docker and Docker Compose on the host machine:
```bash
sudo apt update
sudo apt install docker.io docker-compose-v2 -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```
*(Exit your terminal and log back in to apply group changes).*

Navigate to the project root:
```bash
cd /var/www/medhashree
```

Build and run in daemon mode using docker compose:
```bash
docker compose up -d --build
```

Verify backend health state:
```bash
docker ps
docker compose logs -f
```

---

## 8. Google Analytics, Clarity & OAuth Setup

All client-facing third-party IDs are loaded strictly from environment variables without code modifications.

1. **Google OAuth**: Access [Google Cloud Console](https://console.cloud.google.com/), navigate to API credentials, and create an OAuth Client ID. Whitelist your production domains:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
   Set this value inside `VITE_GOOGLE_CLIENT_ID` in `frontend/.env.production`.
2. **Google Analytics**: Go to [Analytics](https://analytics.google.com), create a Web Data Stream, copy your Measurement ID (looks like `G-XXXXXXXXXX`), and set it as `VITE_GA_MEASUREMENT_ID`.
3. **Microsoft Clarity**: Log in to [Clarity](https://clarity.microsoft.com), copy your project id hash from the dashboard tracking code, and paste it into `VITE_CLARITY_ID`.

---

## 9. Google Search Console & SEO Configuration

To rank and inspect how search bots view the platform:

1. Log in to [Google Search Console](https://search.google.com/search-console).
2. Add a new **URL prefix** property: `https://yourdomain.com`.
3. Verify ownership:
   - Download the verification HTML file.
   - Upload it to your server under: `/var/www/medhashree/frontend/dist/`.
   - Click **Verify** in Search Console.
4. Add the Sitemap:
   - Go to the Sitemaps tab.
   - Enter `https://yourdomain.com/sitemap.xml` and click **Submit**.
5. Request Homepage indexing:
   - Paste `https://yourdomain.com/` in the top search bar.
   - Click **Request Indexing**.

---

## 10. Useful Server Commands Cheatsheet

### PM2 (Process Control)
```bash
# View list of active node servers
pm2 list

# View logs in real-time
pm2 logs medhashree-backend

# Restart, Stop, or Delete the backend process
pm2 restart medhashree-backend
pm2 stop medhashree-backend
pm2 delete medhashree-backend
```

### Nginx (Web Server)
```bash
# Check syntax validation of configurations
sudo nginx -t

# Restart or reload Nginx configurations
sudo systemctl reload nginx
sudo systemctl restart nginx

# View access and error logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL (Database Control)
```bash
# Connect to database local shell
sudo -u postgres psql -d medhashree

# Check postgres active service status
sudo systemctl status postgresql

# Create a local database backup file
pg_dump -U medha_user -h localhost -d medhashree > backup.sql
```

### Docker
```bash
# Stop and clean containers
docker compose down

# Re-build container from fresh code changes
docker compose up -d --build
```
