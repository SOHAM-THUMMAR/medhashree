# 🚀 Medhashree Platform - Ubuntu VPS Deployment Guide

This guide provides step-by-step instructions for deploying the **Medhashree Competitive Quiz & Learning Platform** on an Ubuntu VPS (Ubuntu 20.04/22.04 LTS with 1GB+ RAM).

---

## ⚡ Option 1: One-Command Automated Deployment (Recommended)

The platform includes an automated cross-platform setup script (`start.py`) that configures Node.js, PostgreSQL, PM2, Python monitoring, Nginx reverse proxy, Certbot SSL, and system firewalls automatically.

### 1. Connect to your VPS & Clone Repository
```bash
sudo apt update && sudo apt install -y git python3 python3-pip
git clone https://github.com/SOHAM-THUMMAR/medhashree.git
cd medhashree
```

### 2. Run Automated Setup & Launch Server

#### A. Deployment with Domain & Free SSL Certificate (HTTPS):
```bash
sudo python3 start.py --domain yourdomain.com --run
```

#### B. Deployment with Direct IP / Local Server Access (HTTP):
```bash
sudo python3 start.py --run
```

---

## 🛠️ Option 2: Manual Step-by-Step Deployment Commands

If you prefer to configure components manually on your Ubuntu server, execute the commands below in sequence.

### Step 1: System Update & Package Installation
```bash
# Update Ubuntu package manager
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS & pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx certbot python3-certbot-nginx ufw python3-pip python3-psutil
sudo npm install -g pnpm pm2
```

---

### Step 2: PostgreSQL Database Configuration
```bash
# Start & enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create PostgreSQL database and user
sudo -u postgres psql -c "CREATE USER medha_user WITH PASSWORD 'SecureMedhaPass2026!';"
sudo -u postgres psql -c "CREATE DATABASE medhashree OWNER medha_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE medhashree TO medha_user;"

# Performance Tuning for 1 GB RAM VPS
sudo -u postgres psql -c "ALTER SYSTEM SET shared_buffers = '256MB';"
sudo -u postgres psql -c "ALTER SYSTEM SET work_mem = '8MB';"
sudo -u postgres psql -c "ALTER SYSTEM SET maintenance_work_mem = '64MB';"
sudo -u postgres psql -c "ALTER SYSTEM SET max_connections = '60';"
sudo -u postgres psql -c "SELECT pg_reload_conf();"
```

---

### Step 3: Environment `.env` Configuration
Create the `.env` file in the project root:
```bash
nano .env
```
Paste the following environment variables (adjust values as needed):
```env
PORT=5000
MONITOR_PORT=5001
NODE_ENV=production
JWT_SECRET=super_secret_medhashree_jwt_key_2026
ADMIN_EMAIL=sohamthummar04@gmail.com
INITIAL_ADMIN_PASSWORD=Admin@12345

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=medha_user
DB_PASSWORD=SecureMedhaPass2026!
DB_NAME=medhashree

# SMTP Alert Email Configuration (Optional for Gmail Alerts)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

### Step 4: Install Dependencies & Build Frontend
```bash
# Install backend dependencies
cd backend
pnpm install
cd ..

# Install frontend dependencies and compile production bundle
cd frontend
pnpm install
pnpm build
cd ..
```

---

### Step 5: Start Process Daemons with PM2
```bash
# Navigate to backend directory and start PM2 cluster
cd backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
cd ..
```

---

### Step 6: Configure Nginx Reverse Proxy
Create an Nginx configuration file for Medhashree:
```bash
sudo nano /etc/nginx/sites-available/medhashree
```
Paste the configuration:
```nginx
server {
    listen 80;
    server_name _; # Or replace with your domain e.g. yourdomain.com

    root /var/www/medhashree/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA Routing (React HashRouter / BrowserRouter)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend REST API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Proxy (/socket.io)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable site & restart Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/medhashree /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

### Step 7: UFW Firewall & Security Hardening
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

---

### Step 8: Free SSL Certificate (Certbot HTTPS)
If deploying with a custom domain name:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --non-interactive --agree-tos -m sohamthummar04@gmail.com
```

---

## 📊 Useful PM2 & Server Management Commands

| Action | Command |
| :--- | :--- |
| **Check PM2 Status** | `pm2 status` |
| **View Real-time Logs** | `pm2 logs` |
| **Restart Backend & Monitor** | `pm2 restart all` |
| **Stop All PM2 Services** | `pm2 stop all` |
| **Check Nginx Status** | `sudo systemctl status nginx` |
| **Check PostgreSQL Status** | `sudo systemctl status postgresql` |
| **View Activity Logs File** | `cat backend/logs/activity.json` |

---

## 🔒 Owner Admin Credentials (Default)

- **Admin Login Email**: `sohamthummar04@gmail.com`
- **Initial Password**: `Admin@12345` *(Can be changed anytime via `/admin/users`)*
- **Admin Dashboard URL**: `http://<your-vps-ip>/#/admin/dashboard` or `https://yourdomain.com/#/admin/dashboard`
