# Scripts de Déploiement

Ce répertoire contient tous les scripts de déploiement et de gestion de l'application Tontine API v2.

## 📁 Structure des fichiers

### Scripts de déploiement
- `deploy-robust.sh` - Déploiement robuste avec rollback
- `deploy-simple.sh` - Déploiement simple

### Scripts de démarrage
- `start-sentry.sh` - Démarrage avec Sentry
- `start-dev.sh` - Démarrage en mode développement

### Scripts de gestion
- `manage-processes.sh` - Gestion des processus (status, stop, restart, logs, pid)
- `cleanup.sh` - Nettoyage des processus et services
- `test-deployment.sh` - Test de la configuration avant déploiement

### Configuration système
- `tontine-api.service` - Fichier de service systemd

## 🚀 Utilisation

### Via npm scripts (recommandé)
```bash
# Déploiement
npm run deploy:sentry
npm run deploy:robust
npm run deploy:simple

# Démarrage
npm run start:sentry
npm run start:dev:sentry

# Gestion des processus
npm run process:status
npm run process:stop
npm run process:restart
npm run process:logs
npm run process:pid

# Tests et maintenance
npm run test:deployment
npm run cleanup


```

### Directement
```bash
# Depuis la racine du projet
./scripts/deploy/start-sentry.sh
./scripts/deploy/manage-processes.sh status
```

## 📋 Prérequis

- Node.js 20+ (géré par Volta sur le serveur)
- npm
- systemd (pour les services)
- Caddy (pour le reverse proxy)
- Accès SSH au serveur de production

## 🔧 Configuration

Les scripts utilisent les variables d'environnement définies dans `.env` et les secrets GitHub Actions pour la configuration Sentry.

## 📝 Notes

- Tous les scripts sont exécutables (`chmod +x`)
- Les chemins sont relatifs à la racine du projet
- Le service systemd est automatiquement installé lors du déploiement
- Les logs sont disponibles via `journalctl -u tontine-api.service`
- **Optimisation**: Le dossier `src/` est automatiquement supprimé du serveur de production
- **Déploiement optimisé**: Seul le code compilé (`dist/`) et les fichiers de configuration sont déployés
- **Installation minimale**: Seules les dépendances de production sont installées sur le serveur
- **Reverse proxy automatique**: Caddy est automatiquement redémarré avec le reverse proxy
- Le dossier `src/` est supprimé du serveur pour économiser l'espace
