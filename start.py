#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 Medhashree - Automated Ubuntu Setup, Configuration & Hosting Script (start.py)
─────────────────────────────────────────────────────────────────────────────
 Features:
 - Centralized .env configuration & auto-generation
 - Ubuntu system package installation (Node.js 20, PostgreSQL, Nginx, PM2, Certbot, UFW, psutil)
 - PostgreSQL Database setup & automated schema migrations
 - Backend NPM installation & PM2 process daemon management
 - Python resource monitor sidecar service integration (monitor.py on port 5001)
 - Frontend React Vite build compilation
 - Nginx reverse proxy configuration for REST API, WebSockets (/socket.io), SPA routing
 - Security header hardening & UFW firewall setup
 - Automated service health verification & auto-start on existing setup
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import shutil
import argparse
import subprocess
from pathlib import Path

# Add project root to python path for imports
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, ROOT_DIR.as_posix())

from scripts.setup.colors import Colors, log_info, log_success, log_warn, log_error, log_header
from scripts.setup.env_manager import setup_centralized_env
from scripts.setup.system_deps import install_system_dependencies, is_ubuntu
from scripts.setup.database_setup import setup_postgresql
from scripts.setup.backend_setup import build_backend_and_start_pm2
from scripts.setup.frontend_setup import build_frontend
from scripts.setup.nginx_setup import setup_nginx

def is_root() -> bool:
    """Check root / superuser privileges"""
    return hasattr(os, 'geteuid') and os.geteuid() == 0

def verify_and_start_all(root_dir: Path, env_vars: dict):
    """Verify system status and restart services if stopped"""
    log_header("Verifying System Status & Services")
    
    if is_ubuntu():
        nginx_status = subprocess.run("systemctl is-active nginx", shell=True, capture_output=True, text=True)
        if 'active' not in nginx_status.stdout:
            log_warn("Nginx service is inactive. Starting Nginx...")
            subprocess.run("systemctl start nginx", shell=True, check=False)
        else:
            log_success("Nginx web server is RUNNING.")

    if shutil.which('pm2'):
        pm2_status = subprocess.run("pm2 jlist", shell=True, capture_output=True, text=True)
        if 'medhashree-backend' in pm2_status.stdout and 'medhashree-monitor' in pm2_status.stdout:
            log_success("Backend Node.js & Python Monitor services are RUNNING under PM2.")
        else:
            log_warn("PM2 services inactive. Restarting...")
            backend_dir = root_dir / 'backend'
            subprocess.run("pm2 startOrRestart ecosystem.config.js --env production", shell=True, cwd=backend_dir, check=False)

    log_success("All website services verified & running! Your website is live! 🚀")

def main():
    parser = argparse.ArgumentParser(description="Medhashree Ubuntu Automated Setup & Hosting Script")
    parser.add_argument("--domain", help="Optional domain name for Nginx & SSL (e.g. medhashree.com)", default=None)
    parser.add_argument("--skip-deps", help="Skip system package installation", action="store_true")
    args = parser.parse_args()

    import os
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
    env_vars = setup_centralized_env(ROOT_DIR)

    # 2. System dependencies
    if not args.skip_deps:
        install_system_dependencies()

    # 3. Database setup
    setup_postgresql(env_vars)

    # 4. Backend & Python monitor setup
    build_backend_and_start_pm2(ROOT_DIR, env_vars)

    # 5. Frontend React build
    build_frontend(ROOT_DIR)

    # 6. Nginx & Security
    setup_nginx(ROOT_DIR, env_vars, domain=args.domain)

    # 7. Verification check
    verify_and_start_all(ROOT_DIR, env_vars)

if __name__ == '__main__':
    main()
