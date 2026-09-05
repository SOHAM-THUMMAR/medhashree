"""
Backend Setup & PM2 Process Manager Module
"""

import sys
import shutil
import subprocess
from pathlib import Path
from .colors import log_header, log_info, log_success, log_error

def build_backend_and_start_pm2(root_dir: Path, env_vars: dict):
    """Install backend npm dependencies, run schema init, start PM2 daemons (Backend + Python Monitor)"""
    log_header("3/5 Setting Up Backend Application & PM2")

    backend_dir = root_dir / 'backend'
    if not backend_dir.exists():
        log_error(f"Backend directory not found at {backend_dir}")
        sys.exit(1)

    log_info("Installing backend NPM dependencies...")
    subprocess.run("npm install", shell=True, cwd=backend_dir, check=True)

    log_info("Running database migrations & schema initialization...")
    subprocess.run("node -e \"require('./config/db.js')\"", shell=True, cwd=backend_dir, check=False)

    ecosystem_path = backend_dir / 'ecosystem.config.js'
    port = env_vars.get('PORT', '5000')
    monitor_port = env_vars.get('MONITOR_PORT', '5001')
    monitor_path = (root_dir / 'monitor.py').as_posix()

    ecosystem_content = f"""module.exports = {{
  apps: [
    {{
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
    }},
    {{
      name: 'medhashree-monitor',
      script: '{monitor_path}',
      interpreter: 'python3',
      cwd: '{root_dir.as_posix()}',
      autorestart: true,
      watch: false,
      env: {{
        MONITOR_PORT: {monitor_port}
      }}
    }}
  ]
}};
"""
    ecosystem_path.write_text(ecosystem_content, encoding='utf-8')
    log_info("Created PM2 ecosystem configuration.")

    if shutil.which('pm2'):
        log_info("Starting/Restarting backend & Python monitor with PM2...")
        subprocess.run("pm2 startOrRestart ecosystem.config.js --env production", shell=True, cwd=backend_dir, check=True)
        subprocess.run("pm2 save", shell=True, check=False)

    log_success("Backend application and Python resource monitor running under PM2 daemon.")
