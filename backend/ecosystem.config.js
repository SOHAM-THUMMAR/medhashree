module.exports = {
  apps: [
    {
      name: 'medhashree-backend',
      script: 'server.js',
      instances: 1,             // 1 instance is optimal for a 1 GB RAM server to preserve memory
      exec_mode: 'fork',        // Fork mode has less RAM overhead than cluster mode
      watch: false,             // Do not watch files in production to save CPU cycles
      max_memory_restart: '400M', // Auto-restart if process RAM usage exceeds 400MB (prevents OOM crashes)
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
