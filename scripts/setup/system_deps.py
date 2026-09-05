"""
Ubuntu System Package Installer Module
"""

import sys
import shutil
import subprocess
from .colors import log_header, log_info, log_success, log_warn

def is_ubuntu() -> bool:
    import os
    if os.name != 'posix':
        return False
    return os.path.exists('/etc/debian_version') or os.path.exists('/etc/ubuntu-release')

def run_cmd(cmd, cwd=None, check=True, capture_output=False):
    res = subprocess.run(
        cmd,
        shell=True,
        cwd=cwd,
        check=check,
        stdout=subprocess.PIPE if capture_output else None,
        stderr=subprocess.PIPE if capture_output else None,
        text=True
    )
    return res

def install_system_dependencies():
    """Install required Ubuntu packages (Node 20, Nginx, Postgres, PM2, Certbot, psutil)"""
    log_header("1/5 Installing Ubuntu System Dependencies")
    
    if not is_ubuntu():
        log_warn("Not running on Ubuntu/Debian. Skipping apt package installation.")
        return

    log_info("Updating apt package lists...")
    run_cmd("apt-get update -y")
    log_info("Installing system packages & python3-psutil...")
    run_cmd("apt-get install -y curl git build-essential ufw python3-pip python3-psutil software-properties-common certbot python3-certbot-nginx postgresql postgresql-contrib nginx")
    run_cmd("pip3 install psutil", check=False)

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
