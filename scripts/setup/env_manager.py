"""
Centralized Environment Configuration Manager (.env)
"""

import os
import shutil
import secrets
from pathlib import Path
from .colors import log_info, log_success

def setup_centralized_env(root_dir: Path) -> dict:
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

ENABLE_RESOURCE_MONITORING=true
MONITOR_PORT=5001
PYTHON_MONITOR_URL=http://127.0.0.1:5001/metrics
RESOURCE_MONITOR_INTERVAL_SEC=10
CPU_WARN_THRESHOLD=85
MEMORY_WARN_THRESHOLD=90

VITE_API_BASE_URL=/api
VITE_SOCKET_URL=/
"""
            env_file.write_text(default_env, encoding='utf-8')
            log_success("Generated brand new .env file with secure secrets.")
    else:
        log_info("Centralized .env file exists.")

    env_vars = {}
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip()

    return env_vars
