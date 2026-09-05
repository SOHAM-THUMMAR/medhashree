"""
Nginx Reverse Proxy, Security & UFW Firewall Setup Module
"""

import subprocess
from pathlib import Path
from .colors import log_header, log_info, log_success, log_error
from .system_deps import is_ubuntu

def setup_nginx(root_dir: Path, env_vars: dict, domain: str = None):
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

    res = subprocess.run("nginx -t", shell=True, capture_output=True, text=True)
    if res.returncode == 0:
        subprocess.run("systemctl reload nginx", shell=True, check=False)
        log_success("Nginx configuration verified & reloaded.")
    else:
        log_error(f"Nginx configuration test failed: {res.stderr}")

    log_info("Configuring UFW Firewall rules...")
    subprocess.run("ufw allow 'Nginx Full'", shell=True, check=False)
    subprocess.run("ufw allow OpenSSH", shell=True, check=False)
    subprocess.run("ufw --force enable", shell=True, check=False)
    log_success("UFW Firewall configured (HTTP/HTTPS/SSH open).")

    if domain:
        log_info(f"Setting up Let's Encrypt SSL certificate for domain: {domain}...")
        admin_email = env_vars.get('ADMIN_EMAIL', 'admin@medhashree.com')
        subprocess.run(f"certbot --nginx -d {domain} --non-interactive --agree-tos -m {admin_email} --redirect", shell=True, check=False)
        log_success("Certbot SSL certificate setup completed.")
