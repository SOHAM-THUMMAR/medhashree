"""
Frontend React Vite Production Compiler Module
"""

import sys
import subprocess
from pathlib import Path
from .colors import log_header, log_info, log_success, log_error

def build_frontend(root_dir: Path):
    """Install frontend dependencies & compile React Vite production bundle"""
    log_header("4/5 Building Frontend React Production Assets")

    frontend_dir = root_dir / 'frontend'
    if not frontend_dir.exists():
        log_error(f"Frontend directory not found at {frontend_dir}")
        sys.exit(1)

    log_info("Installing frontend NPM dependencies...")
    subprocess.run("npm install", shell=True, cwd=frontend_dir, check=True)

    log_info("Compiling production React bundle with Vite...")
    subprocess.run("npm run build", shell=True, cwd=frontend_dir, check=True)

    dist_dir = frontend_dir / 'dist'
    if dist_dir.exists():
        log_success(f"Frontend compiled successfully to {dist_dir}")
    else:
        log_error("Frontend build output directory dist/ not found!")
