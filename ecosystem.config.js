module.exports = {
  apps: [{
    name: 'tontine-api',
    script: 'dist/main.js',
    instances: 1,
    exec_mode: 'fork', // Changement de cluster vers fork pour éviter les problèmes de redémarrage
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
    error_file: '/tmp/logs/err.log',
    out_file: '/tmp/logs/out.log',
    log_file: '/tmp/logs/combined.log',
    time: true,
    // Configuration du redémarrage automatique
    autorestart: true,
    max_restarts: 5, // Réduit de 10 à 5
    min_uptime: '30s', // Augmenté de 10s à 30s
    restart_delay: 5000, // Délai de 5 secondes entre les redémarrages
    // Configuration des logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Configuration pour éviter les redémarrages en boucle
    kill_timeout: 5000,
    listen_timeout: 10000
  }]
};
