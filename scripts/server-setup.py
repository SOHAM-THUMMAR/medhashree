#!/usr/bin/env python3
import os
import sys
import subprocess
import shutil
import re
import socket

# Colors for terminal output
class Colors:
    RESET = '\033[0m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    CYAN = '\033[36m'
    BOLD = '\033[1m'

def log_header(message):
    print(f"\n{Colors.BOLD}{Colors.CYAN}=== {message} ==={Colors.RESET}")

def log_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")

def log_warning(message):
    print(f"{Colors.YELLOW}⚠ WARNING: {message}{Colors.RESET}")

def log_error(message):
    print(f"{Colors.RED}✗ ERROR: {message}{Colors.RESET}")

def log_info(message):
    print(f"{Colors.BLUE}i {message}{Colors.RESET}")

# -------------------------------------------------------------
# 1. Parse Env Variables from backend/.env
# -------------------------------------------------------------
def load_env():
    env_vars = {
        'DB_HOST': 'localhost',
        'DB_PORT': '5432',
        'DB_USER': 'postgres',
        'DB_PASSWORD': '',
        'DB_NAME': 'quizdash',
        'DOMAIN_NAME': 'yourdomain.com'
    }
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(script_dir, '..', 'backend', '.env')
    
    if os.path.exists(env_path):
        log_info(f"Loading env parameters from {env_path}")
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                match = re.match(r'^([^=]+)=(.*)$', line)
                if match:
                    key = match.group(1).strip()
                    val = match.group(2).strip()
                    # Strip quotes if present
                    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1]
                    env_vars[key] = val
    else:
        log_warning(f"backend/.env not found at {env_path}. Using default values.")
        
    return env_vars

# -------------------------------------------------------------
# 2. Check and Create PostgreSQL Database
# -------------------------------------------------------------
def setup_database(env):
    log_header("DATABASE AUDIT & CREATION")
    
    host = env['DB_HOST']
    port = env['DB_PORT']
    user = env['DB_USER']
    password = env['DB_PASSWORD']
    db_name = env['DB_NAME']
    
    log_info(f"Target Database: '{db_name}' on {host}:{port} as user '{user}'")
    
    # 2.1 Verify PostgreSQL server is reachable
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        s.connect((host, int(port)))
        s.close()
        log_success("PostgreSQL port is reachable.")
    except Exception as e:
        log_error(f"Cannot reach PostgreSQL server on {host}:{port}. Is it running?")
        log_info("Please start PostgreSQL service: 'sudo systemctl start postgresql'")
        return False

    # 2.2 Verify psql utility is installed
    psql_path = shutil.which('psql')
    if not psql_path:
        log_warning("'psql' CLI utility is not installed on this server. Unable to perform automated DB creation checks.")
        log_info("Install postgres-client: 'sudo apt install postgresql-client'")
        return False
        
    # Prepare environment with password for psql
    psql_env = os.environ.copy()
    if password:
        psql_env['PGPASSWORD'] = password
        
    # 2.3 Check if target database exists
    check_cmd = [
        'psql',
        '-h', host,
        '-p', port,
        '-U', user,
        '-d', 'postgres',
        '-tAc', f"SELECT 1 FROM pg_database WHERE datname='{db_name}'"
    ]
    
    try:
        result = subprocess.run(check_cmd, env=psql_env, capture_output=True, text=True, check=True)
        db_exists = result.stdout.strip() == '1'
        
        if db_exists:
            log_success(f"Database '{db_name}' already exists.")
        else:
            log_warning(f"Database '{db_name}' does not exist. Creating it...")
            
            # Sanitize database name
            db_name_sanitized = re.sub(r'[^a-zA-Z0-9_]', '', db_name)
            create_cmd = [
                'psql',
                '-h', host,
                '-p', port,
                '-U', user,
                '-d', 'postgres',
                '-c', f"CREATE DATABASE {db_name_sanitized};"
            ]
            
            create_result = subprocess.run(create_cmd, env=psql_env, capture_output=True, text=True, check=True)
            log_success(f"Database '{db_name_sanitized}' created successfully.")
            
    except subprocess.CalledProcessError as e:
        log_error(f"Failed to query database server: {e.stderr.strip()}")
        log_info("Check database credentials in backend/.env")
        return False
        
    return True

# -------------------------------------------------------------
# 3. Check and Update Nginx Configuration
# -------------------------------------------------------------
def setup_nginx(env):
    log_header("NGINX CONFIGURATION AUDIT & UPDATE")
    
    domain = env.get('DOMAIN_NAME', 'yourdomain.com')
    log_info(f"Target domain: {domain}")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_conf_path = os.path.abspath(os.path.join(script_dir, '..', 'nginx.conf'))
    
    if not os.path.exists(repo_conf_path):
        log_error(f"Repository nginx.conf not found at {repo_conf_path}")
        return False
        
    # Read repo nginx.conf and replace domain placeholders
    with open(repo_conf_path, 'r') as f:
        repo_conf_content = f.read()
        
    processed_conf = repo_conf_content.replace('yourdomain.com', domain)
    
    # 3.1 Check if Nginx paths exist
    nginx_available_dir = "/etc/nginx/sites-available"
    nginx_enabled_dir = "/etc/nginx/sites-enabled"
    target_conf_path = os.path.join(nginx_available_dir, "medhashree")
    symlink_conf_path = os.path.join(nginx_enabled_dir, "medhashree")
    
    # Verify Nginx is installed on system
    if not os.path.exists("/etc/nginx"):
        log_warning("Nginx directory (/etc/nginx) does not exist on this server. Running in DRY-RUN mode.")
        dry_run_path = os.path.join(script_dir, "medhashree.nginx.processed")
        with open(dry_run_path, 'w') as f:
            f.write(processed_conf)
        log_info(f"Processed Nginx configuration saved for reference at: {dry_run_path}")
        return True
        
    # Check for root/sudo privileges
    is_root = os.geteuid() == 0 if hasattr(os, 'geteuid') else False
    if not is_root:
        log_warning("Writing to Nginx config requires root privileges. Running in DRY-RUN mode.")
        log_info("Run this script using sudo: 'sudo python3 scripts/server-setup.py'")
        dry_run_path = os.path.join(script_dir, "medhashree.nginx.processed")
        with open(dry_run_path, 'w') as f:
            f.write(processed_conf)
        log_info(f"Processed Nginx configuration saved for reference at: {dry_run_path}")
        return True

    # 3.2 Compare current file if it exists
    update_needed = True
    if os.path.exists(target_conf_path):
        with open(target_conf_path, 'r') as f:
            current_conf = f.read()
        if current_conf.strip() == processed_conf.strip():
            log_success("Active Nginx configuration is already identical to the repository.")
            update_needed = False
            
    # 3.3 Apply updates if needed
    if update_needed:
        # Create backup if file exists
        if os.path.exists(target_conf_path):
            backup_path = target_conf_path + ".bak"
            log_info(f"Creating backup of existing Nginx configuration at {backup_path}")
            shutil.copy2(target_conf_path, backup_path)
            
        log_info(f"Writing updated configuration to {target_conf_path}")
        with open(target_conf_path, 'w') as f:
            f.write(processed_conf)
            
        # Ensure symlink exists
        if not os.path.exists(symlink_conf_path):
            log_info(f"Creating Nginx sites-enabled symlink: {symlink_conf_path} -> {target_conf_path}")
            os.symlink(target_conf_path, symlink_conf_path)
            
        # 3.4 Verify Nginx syntax
        log_info("Testing Nginx configuration syntax...")
        test_result = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
        
        if test_result.returncode == 0:
            log_success("Nginx configuration syntax is valid.")
            
            # Reload Nginx
            log_info("Reloading Nginx web server...")
            reload_result = subprocess.run(['systemctl', 'reload', 'nginx'], capture_output=True, text=True)
            if reload_result.returncode == 0:
                log_success("Nginx reloaded successfully!")
            else:
                # Fallback to service command
                reload_result = subprocess.run(['service', 'nginx', 'reload'], capture_output=True, text=True)
                if reload_result.returncode == 0:
                    log_success("Nginx reloaded successfully!")
                else:
                    log_error(f"Failed to reload Nginx: {reload_result.stderr.strip()}")
                    return False
        else:
            log_error(f"Nginx syntax check failed:\n{test_result.stderr.strip()}")
            # Restore backup if available
            backup_path = target_conf_path + ".bak"
            if os.path.exists(backup_path):
                log_warning("Restoring configuration backup due to syntax failure...")
                shutil.copy2(backup_path, target_conf_path)
                subprocess.run(['nginx', '-t'], capture_output=True)
            return False
            
    return True

# -------------------------------------------------------------
# Main Script Entry
# -------------------------------------------------------------
if __name__ == '__main__':
    log_header("MEDHASHREE PRODUCTION SERVER MANAGEMENT TOOL")
    
    # Check python version
    if sys.version_info[0] < 3:
        log_error("This script requires Python 3.")
        sys.exit(1)
        
    env = load_env()
    
    db_success = setup_database(env)
    nginx_success = setup_nginx(env)
    
    log_header("SERVER SETUP AUDIT SUMMARY")
    if db_success:
        log_success("PostgreSQL Database verification completed successfully.")
    else:
        log_warning("PostgreSQL Database verification had errors or warnings.")
        
    if nginx_success:
        log_success("Nginx configuration verification completed successfully.")
    else:
        log_error("Nginx configuration verification failed.")
        
    if db_success and nginx_success:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ Server checks and configuration updates completed successfully!{Colors.RESET}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}✗ Server checks completed with errors. See details above.{Colors.RESET}\n")
        sys.exit(1)
