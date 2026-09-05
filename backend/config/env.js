const path = require('path');
const dotenv = require('dotenv');

// Load centralized root .env first, fallback to backend/.env
const rootEnvPath = path.resolve(__dirname, '../../.env');
const backendEnvPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'medhashree',
  DB_SSL: process.env.DB_SSL || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  
  // SMTP & Email Alert settings
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  
  // Online User Threshold Alert settings
  ENABLE_ONLINE_ALERTS: process.env.ENABLE_ONLINE_ALERTS !== 'false',
  ONLINE_USER_ALERT_THRESHOLD: parseInt(process.env.ONLINE_USER_ALERT_THRESHOLD || '100', 10),
  ALERT_COOLDOWN_MINUTES: parseInt(process.env.ALERT_COOLDOWN_MINUTES || '60', 10),

  // Resource & System Monitoring settings
  ENABLE_RESOURCE_MONITORING: process.env.ENABLE_RESOURCE_MONITORING !== 'false',
  PYTHON_MONITOR_URL: process.env.PYTHON_MONITOR_URL || 'http://127.0.0.1:5001/metrics',
  RESOURCE_MONITOR_INTERVAL_SEC: parseInt(process.env.RESOURCE_MONITOR_INTERVAL_SEC || '10', 10),
  CPU_WARN_THRESHOLD: parseInt(process.env.CPU_WARN_THRESHOLD || '85', 10),
  MEMORY_WARN_THRESHOLD: parseInt(process.env.MEMORY_WARN_THRESHOLD || '90', 10)
};

// Fast failure warning for missing config (only if DATABASE_URL is not set)
if (!env.DATABASE_URL) {
  const required = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  for (const key of required) {
    if (!env[key]) {
      console.warn(`Warning: Environment variable ${key} is not set. Database connection may fail.`);
    }
  }
}

module.exports = env;
