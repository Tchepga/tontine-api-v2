module.exports = {
  apps: [{
    name: 'tontine-api',
    script: 'dist/main.js',
    interpreter: '/root/.volta/bin/node',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    // Configuration optimisée pour production
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Configuration du redémarrage automatique
    autorestart: true,
    max_restarts: 5,
    min_uptime: '30s',
    restart_delay: 5000,
    // Configuration des logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Configuration pour éviter les redémarrages en boucle
    kill_timeout: 5000,
    listen_timeout: 10000,
    // Configuration de santé
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true,
    // Configuration de performance
    node_args: '--max-old-space-size=1024',
    // Configuration de sécurité
    uid: 'www-data',
    gid: 'www-data'
  }]
};
