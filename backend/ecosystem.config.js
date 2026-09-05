module.exports = {
  apps: [
    {
      name: 'medhashree-backend',
      script: 'server.js',
      cwd: 'D:/work 4 life/medhashree/backend',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      node_args: '--max-old-space-size=256',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'medhashree-monitor',
      script: 'D:/work 4 life/medhashree/monitor.py',
      interpreter: 'python',
      cwd: 'D:/work 4 life/medhashree',
      autorestart: true,
      watch: false,
      max_memory_restart: '80M',
      env: {
        MONITOR_PORT: 5001
      }
    }
  ]
};
