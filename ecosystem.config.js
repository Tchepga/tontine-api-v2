module.exports = {
  apps: [{
    name: 'tontine-api',
    script: 'dist/main.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    // Configuration pour Docker
    watch: false,
    max_memory_restart: '1G',
    error_file: '/tmp/err.log',
    out_file: '/tmp/out.log',
    log_file: '/tmp/combined.log',
    time: true,
    // Redémarrage automatique
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // Configuration des logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
