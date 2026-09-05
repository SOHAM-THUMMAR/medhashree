"""
PostgreSQL Database Setup & Migration Module
"""

import subprocess
from .colors import log_header, log_info, log_success, log_warn
from .system_deps import is_ubuntu, is_windows

def setup_postgresql(env_vars: dict):
    """Configure PostgreSQL database, user, and initial schema"""
    log_header("2/5 Configuring PostgreSQL Database")

    if is_ubuntu():
        subprocess.run("systemctl start postgresql", shell=True, check=False)
        subprocess.run("systemctl enable postgresql", shell=True, check=False)

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
            subprocess.run(f'sudo -u postgres psql -c "{sql_commands}"', shell=True, check=False)

        # 1 GB RAM / 2 CPU Cores VPS PostgreSQL Performance Tuning
        log_info("Applying 1 GB RAM / 2 CPU Cores PostgreSQL memory and pool optimizations...")
        pg_tune_commands = """
        ALTER SYSTEM SET shared_buffers = '256MB';
        ALTER SYSTEM SET work_mem = '8MB';
        ALTER SYSTEM SET maintenance_work_mem = '64MB';
        ALTER SYSTEM SET effective_cache_size = '512MB';
        ALTER SYSTEM SET max_connections = '60';
        SELECT pg_reload_conf();
        """
        subprocess.run(f'sudo -u postgres psql -c "{pg_tune_commands}"', shell=True, check=False)
        log_success("PostgreSQL user, database, and 1 GB RAM performance tuning configured.")

    elif is_windows():
        log_info("Windows environment detected for PostgreSQL check.")
        res = subprocess.run("net start", shell=True, capture_output=True, text=True)
        if 'postgresql' in res.stdout.lower():
            log_success("PostgreSQL Windows service is RUNNING.")
        else:
            log_info("Attempting to start PostgreSQL Windows service...")
            subprocess.run("net start postgresql-x64-16", shell=True, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run("net start postgresql-x64-15", shell=True, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run("net start postgresql", shell=True, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        db_host = env_vars.get('DB_HOST', 'localhost')
        db_port = env_vars.get('DB_PORT', '5432')
        db_name = env_vars.get('DB_NAME', 'medhashree')
        log_info(f"Target Database: {db_host}:{db_port}/{db_name}")
        log_info("Schema initialization & auto-creation will execute in Backend Setup step.")
    else:
        log_info("Non-Linux OS detected. Ensure PostgreSQL server is running on target port.")


