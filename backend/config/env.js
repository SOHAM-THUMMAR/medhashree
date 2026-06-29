require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'quizdash',
  DB_SSL: process.env.DB_SSL || '',
  FRONTEND_URL: process.env.FRONTEND_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
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
