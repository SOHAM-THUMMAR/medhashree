"""
PostgreSQL Database Setup & Migration Module
"""

import subprocess
from .colors import log_header, log_info, log_success
from .system_deps import is_ubuntu

def setup_postgresql(env_vars: dict):
    """Configure PostgreSQL database, user, and initial schema"""
    log_header("2/5 Configuring PostgreSQL Database")

    if not is_ubuntu():
        log_info("Skipping PostgreSQL service management on non-Ubuntu environment.")
        return

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

    # 4 GB RAM VPS PostgreSQL Performance Tuning
    log_info("Applying 4 GB RAM PostgreSQL memory and pool optimizations...")
    pg_tune_commands = """
    ALTER SYSTEM SET shared_buffers = '1GB';
    ALTER SYSTEM SET work_mem = '16MB';
    ALTER SYSTEM SET maintenance_work_mem = '256MB';
    ALTER SYSTEM SET effective_cache_size = '2GB';
    ALTER SYSTEM SET max_connections = '100';
    SELECT pg_reload_conf();
    """
    subprocess.run(f'sudo -u postgres psql -c "{pg_tune_commands}"', shell=True, check=False)

    log_success("PostgreSQL user, database, and 4 GB RAM performance tuning configured.")
