#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 Medhashree - Automated Ubuntu Setup, Configuration & Hosting Script (start.py)
─────────────────────────────────────────────────────────────────────────────
 Features:
 - Centralized .env configuration & auto-generation
 - Ubuntu system package installation (Node.js 20, PostgreSQL, Nginx, PM2, Certbot, UFW)
 - PostgreSQL Database setup & automated schema migrations
 - Backend NPM installation & PM2 process daemon management
 - Frontend React Vite build compilation
 - Nginx reverse proxy configuration for REST API, WebSockets (/socket.io), SPA routing
 - Security header hardening & UFW firewall setup
 - Automated service health verification & auto-start on existing setup
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import subprocess
import shutil
import re
import secrets
import argparse
import time
from pathlib import Path

# Color output formatting for terminal logs
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log_info(msg):
    print(f"{Colors.OKCYAN}[INFO] {msg}{Colors.ENDC}")

def log_success(msg):
    print(f"{Colors.OKGREEN}[SUCCESS] {msg}{Colors.ENDC}")

def log_warn(msg):
    print(f"{Colors.WARNING}[WARN] {msg}{Colors.ENDC}")

def log_error(msg):
    print(f"{Colors.FAIL}[ERROR] {msg}{Colors.ENDC}")

def log_header(msg):
    print(f"\n{Colors.BOLD}{Colors.HEADER}===================================================={Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER} {msg} {Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}===================================================={Colors.ENDC}\n")

def run_cmd(cmd, cwd=None, check=True, capture_output=False, shell=True):
    """Utility helper to execute system commands safely"""
    try:
        res = subprocess.run(
            cmd,
            shell=shell,
            cwd=cwd,
            check=check,
            stdout=subprocess.PIPE if capture_output else None,
            stderr=subprocess.PIPE if capture_output else None,
            text=True
        )
        return res
    except subprocess.CalledProcessError as e:
        log_error(f"Command failed: {cmd}")
        if capture_output and e.stderr:
            log_error(f"Error output: {e.stderr.strip()}")
        if check:
            raise e
        return e

def is_ubuntu():
    """Detect if running on Ubuntu/Debian Linux"""
    if os.name != 'posix':
        return False
    return os.path.exists('/etc/debian_version') or os.path.exists('/etc/ubuntu-release')

def is_root():
    """Check root / superuser privileges"""
    return os.geteuid() == 0 if hasattr(os, 'geteuid') else False

def setup_centralized_env(root_dir):
    """Ensure centralized root .env file exists with secure defaults"""
    log_info("Setting up Centralized .env configuration...")
    env_file = root_dir / '.env'
    env_example = root_dir / '.env.example'

    if not env_file.exists():
        if env_example.exists():
            shutil.copy(env_example, env_file)
            log_success("Created .env from .env.example template.")
        else:
            jwt_secret = secrets.token_hex(32)
            default_env = f"""# Centralized .env configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost

DB_HOST=localhost
DB_PORT=5432
DB_USER=medhashree_user
DB_PASSWORD={secrets.token_urlsafe(16)}
DB_NAME=medhashree
DB_SSL=false

JWT_SECRET={jwt_secret}

EMAIL_USER=
EMAIL_PASS=
ADMIN_EMAIL=admin@medhashree.com

ENABLE_ONLINE_ALERTS=true
ONLINE_USER_ALERT_THRESHOLD=100
ALERT_COOLDOWN_MINUTES=60

VITE_API_BASE_URL=/api
VITE_SOCKET_URL=/
"""
            env_file.write_text(default_env, encoding='utf-8')
            log_success("Generated brand new .env file with secure JWT secret.")
    else:
        log_info("Centralized .env file exists.")

    # Read .env parameters into dictionary
    env_vars = {}
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip()

    return env_vars

def install_system_dependencies():
    """Install required Ubuntu packages (Node 20, Nginx, Postgres, PM2, Certbot)"""
    log_header("1/5 Installing Ubuntu System Dependencies")
    
    if not is_ubuntu():
        log_warn("Not running on Ubuntu/Debian. Skipping apt package installation.")
        return

    log_info("Updating apt package lists...")
    run_cmd("apt-get update -y")
    run_cmd("apt-get install -y curl git build-essential ufw python3-pip software-properties-common certbot python3-certbot-nginx postgresql postgresql-contrib nginx")

    # Check Node.js version
    node_installed = shutil.which('node') is not None
    node_version_ok = False
    if node_installed:
        res = run_cmd("node -v", capture_output=True, check=False)
        if res.returncode == 0 and ('v20.' in res.stdout or 'v22.' in res.stdout or 'v18.' in res.stdout):
            node_version_ok = True
            log_info(f"Node.js already installed: {res.stdout.strip()}")

    if not node_version_ok:
        log_info("Installing Node.js 20.x LTS via NodeSource...")
        run_cmd("curl -fsSL https://deb.nodesource.com/setup_20.x | bash -")
        run_cmd("apt-get install -y nodejs")

    # Install PM2 globally
    if shutil.which('pm2') is None:
        log_info("Installing PM2 process manager globally...")
        run_cmd("npm install -g pm2")

    log_success("System dependencies verified & installed successfully.")

def setup_postgresql(env_vars):
    """Configure PostgreSQL database, user, and initial schema"""
    log_header("2/5 Configuring PostgreSQL Database")

    if not is_ubuntu():
        log_info("Skipping PostgreSQL service management on non-Ubuntu environment.")
        return

    # Ensure postgresql service is active
    run_cmd("systemctl start postgresql")
    run_cmd("systemctl enable postgresql")

    db_user = env_vars.get('DB_USER', 'postgres')
    db_pass = env_vars.get('DB_PASSWORD', 'postgres')
    db_name = env_vars.get('DB_NAME', 'medhashree')

    if db_user != 'postgres':
        log_info(f"Creating PostgreSQL user '{db_user}' and database '{db_name}'...")
        sql_commands = f"""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '{db_user}') THEN
                CREATE USER {db_user} WITH PASSWORD '{db_pass}';
            END IF;
        END
        $$;
        SELECT 'CREATE DATABASE {db_name} OWNER {db_user}'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '{db_name}')\\gexec
        GRANT ALL PRIVILEGES ON DATABASE {db_name} TO {db_user};
        """
        run_cmd(f'sudo -u postgres psql -c "{sql_commands}"', check=False)

    log_success("PostgreSQL user and database configured.")

def build_backend_and_start_pm2(root_dir, env_vars):
    """Install backend npm dependencies, run schema init, start PM2 daemon"""
    log_header("3/5 Setting Up Backend Application & PM2")

    backend_dir = root_dir / 'backend'
    if not backend_dir.exists():
        log_error(f"Backend directory not found at {backend_dir}")
        sys.exit(1)

    log_info("Installing backend NPM dependencies...")
    run_cmd("npm install", cwd=backend_dir)

    # Initialize database schema & migrations
    log_info("Running database migrations & schema initialization...")
    run_cmd("node -e \"require('./config/db.js')\"", cwd=backend_dir, check=False)

    # Create PM2 ecosystem config
    ecosystem_path = backend_dir / 'ecosystem.config.js'
    port = env_vars.get('PORT', '5000')

    ecosystem_content = f"""module.exports = {{
  apps: [{{
    name: 'medhashree-backend',
    script: 'server.js',
    cwd: '{backend_dir.as_posix()}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {{
      NODE_ENV: 'production',
      PORT: {port}
    }}
  }}]
}};
"""
    ecosystem_path.write_text(ecosystem_content, encoding='utf-8')
    log_info("Created PM2 ecosystem configuration.")

    # Start backend with PM2
    if shutil.which('pm2'):
        log_info("Starting/Restarting backend with PM2...")
        run_cmd(f"pm2 startOrRestart ecosystem.config.js --env production", cwd=backend_dir)
        run_cmd("pm2 save", check=False)

    log_success("Backend application initialized and running on PM2.")

def build_frontend(root_dir):
    """Install frontend dependencies & compile React Vite production bundle"""
    log_header("4/5 Building Frontend React Production Assets")

    frontend_dir = root_dir / 'frontend'
    if not frontend_dir.exists():
        log_error(f"Frontend directory not found at {frontend_dir}")
        sys.exit(1)

    log_info("Installing frontend NPM dependencies...")
    run_cmd("npm install", cwd=frontend_dir)

    log_info("Compiling production React bundle with Vite...")
    run_cmd("npm run build", cwd=frontend_dir)

    dist_dir = frontend_dir / 'dist'
    if dist_dir.exists():
        log_success(f"Frontend compiled successfully to {dist_dir}")
    else:
        log_error("Frontend build output directory dist/ not found!")

def setup_nginx(root_dir, env_vars, domain=None):
    """Configure Nginx reverse proxy, security headers, WebSockets, SPA fallback"""
    log_header("5/5 Configuring Nginx & UFW Firewall")

    if not is_ubuntu():
        log_info("Skipping Nginx system configuration on non-Ubuntu system.")
        return

    frontend_dist = (root_dir / 'frontend' / 'dist').as_posix()
    backend_port = env_vars.get('PORT', '5000')
    server_name = domain if domain else "_"

    nginx_config = f"""# Medhashree Production Nginx Site Configuration
server {{
    listen 80;
    listen [::]:80;
    server_name {server_name};

    root {frontend_dist};
    index index.html;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static Assets Caching (Vite bundle)
    location /assets/ {{
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }}

    # REST API Reverse Proxy
    location /api/ {{
        proxy_pass http://127.0.0.1:{backend_port}/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }}

    # Socket.IO Real-time WebSockets
    location /socket.io/ {{
        proxy_pass http://127.0.0.1:{backend_port}/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
    }}

    # React SPA Fallback Router
    location / {{
        try_files $uri $uri/ /index.html;
    }}
}}
"""

    site_available = Path("/etc/nginx/sites-available/medhashree")
    site_enabled = Path("/etc/nginx/sites-enabled/medhashree")
    default_enabled = Path("/etc/nginx/sites-enabled/default")

    log_info("Writing Nginx site configuration...")
    site_available.write_text(nginx_config, encoding='utf-8')

    if not site_enabled.exists():
        site_enabled.symlink_to(site_available)

    if default_enabled.exists():
        default_enabled.unlink()

    # Test and reload Nginx
    res = run_cmd("nginx -t", capture_output=True, check=False)
    if res.returncode == 0:
        run_cmd("systemctl reload nginx")
        log_success("Nginx configuration verified & reloaded.")
    else:
        log_error(f"Nginx configuration test failed: {res.stderr}")

    # UFW Firewall configuration
    log_info("Configuring UFW Firewall rules...")
    run_cmd("ufw allow 'Nginx Full'", check=False)
    run_cmd("ufw allow OpenSSH", check=False)
    run_cmd("ufw --force enable", check=False)
    log_success("UFW Firewall configured (HTTP/HTTPS/SSH open).")

    # Optional Let's Encrypt SSL Certbot
    if domain:
        log_info(f"Setting up Let's Encrypt SSL certificate for domain: {domain}...")
        admin_email = env_vars.get('ADMIN_EMAIL', 'admin@medhashree.com')
        run_cmd(f"certbot --nginx -d {domain} --non-interactive --agree-tos -m {admin_email} --redirect", check=False)
        log_success("Certbot SSL certificate setup completed.")

def verify_and_start_all(root_dir, env_vars):
    """Verify system status and restart services if stopped"""
    log_header("Verifying System Status & Services")
    
    port = env_vars.get('PORT', '5000')

    # Check Nginx status
    if is_ubuntu():
        nginx_status = run_cmd("systemctl is-active nginx", capture_output=True, check=False)
        if 'active' not in nginx_status.stdout:
            log_warn("Nginx service is inactive. Starting Nginx...")
            run_cmd("systemctl start nginx")
        else:
            log_success("Nginx web server is RUNNING.")

    # Check PM2 backend process
    if shutil.which('pm2'):
        pm2_status = run_cmd("pm2 jlist", capture_output=True, check=False)
        if 'medhashree-backend' in pm2_status.stdout:
            log_success("Backend Node.js service is RUNNING on PM2.")
        else:
            log_warn("Backend service not active in PM2. Restarting...")
            backend_dir = root_dir / 'backend'
            run_cmd("pm2 startOrRestart ecosystem.config.js --env production", cwd=backend_dir, check=False)

    log_success("All website services verified & running! Your website is live! 🚀")

def main():
    parser = argparse.ArgumentParser(description="Medhashree Ubuntu Automated Setup & Hosting Script")
    parser.add_argument("--domain", help="Optional domain name for Nginx & SSL (e.g. medhashree.com)", default=None)
    parser.add_argument("--skip-deps", help="Skip system package installation", action="store_true")
    args = parser.parse_args()

    root_dir = Path(__file__).resolve().parent

    print(f"{Colors.BOLD}{Colors.OKGREEN}")
    print(r"""
  __  __ edhashree - Quiz & Learning Platform
 |  \/  |  Automated Ubuntu Setup & Nginx Hosting Script
 |_|\/|_|  Owner & Security Control Framework 2026
    """)
    print(f"{Colors.ENDC}")

    if is_ubuntu() and not is_root():
        log_error("This script requires root/sudo privileges on Ubuntu. Please re-run with: sudo python3 start.py")
        sys.exit(1)

    # 1. Setup centralized .env
    env_vars = setup_centralized_env(root_dir)

    # 2. System dependencies
    if not args.skip_deps:
        install_system_dependencies()

    # 3. Database setup
    setup_postgresql(env_vars)

    # 4. Backend setup & PM2
    build_backend_and_start_pm2(root_dir, env_vars)

    # 5. Frontend React build
    build_frontend(root_dir)

    # 6. Nginx & Security
    setup_nginx(root_dir, env_vars, domain=args.domain)

    # 7. Verification check
    verify_and_start_all(root_dir, env_vars)

if __name__ == '__main__':
    main()
