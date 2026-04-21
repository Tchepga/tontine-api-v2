# Configuration Sentry pour l'API Tontine

## 🚀 Remplacement de PM2 par Sentry

Ce projet a été migré de PM2 vers Sentry pour une meilleure gestion des erreurs et du monitoring.

## 📦 Installation

Les dépendances PM2 ont été supprimées et remplacées par Sentry :

```bash
npm install @sentry/node @sentry/profiling-node
```

## ⚙️ Configuration

### 1. Variables d'environnement

Ajoutez dans votre fichier `.env` :

```bash
# Configuration Sentry
SENTRY_DSN=votre-sentry-dsn-ici
SENTRY_AUTH_TOKEN=votre-sentry-auth-token-ici
SENTRY_ORG=votre-organisation-sentry
SENTRY_PROJECT=votre-projet-sentry
NODE_ENV=production
```

### 2. Récupérer votre DSN Sentry

1. Connectez-vous à [Sentry.io](https://sentry.io)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Copiez le DSN depuis les paramètres du projet

## 🚀 Démarrage

### Développement
```bash
npm run start:dev
```

### Production avec Sentry
```bash
npm run start:sentry
```

### Ou manuellement
```bash
npm run build:prod
node dist/main.js
```

## 📊 Fonctionnalités Sentry

- **Capture d'erreurs** : Toutes les erreurs sont automatiquement capturées
- **Performance monitoring** : Suivi des temps de réponse et des transactions
- **Profiling** : Analyse détaillée des performances
- **Environnements** : Séparation dev/prod avec différents niveaux de sampling

## 🔧 Scripts disponibles

- `npm run start:sentry` : Démarrage complet avec Sentry
- `npm run start:prod:sentry` : Construction + démarrage
- `npm run build:prod` : Construction de production
- `npm run deploy:sentry` : Déploiement complet avec release Sentry

## 📈 Monitoring

Consultez votre dashboard Sentry pour :
- Voir les erreurs en temps réel
- Analyser les performances
- Surveiller la santé de votre API
- Recevoir des alertes

## 🆚 Avantages vs PM2

| PM2 | Sentry |
|-----|--------|
| Gestion des processus | ✅ | ❌ |
| Monitoring basique | ✅ | ❌ |
| Capture d'erreurs | ❌ | ✅ |
| Performance monitoring | ❌ | ✅ |
| Alertes intelligentes | ❌ | ✅ |
| Dashboard avancé | ❌ | ✅ |

## 🚨 Gestion des erreurs

Sentry capture automatiquement :
- Erreurs non gérées
- Erreurs de validation
- Timeouts de base de données
- Erreurs d'authentification
- Problèmes de performance

## 📝 Logs

En développement, tous les événements Sentry sont également loggés dans la console pour faciliter le debugging.

## 🚀 Déploiements automatisés

### Avec le script de déploiement

```bash
npm run deploy:sentry
```

Ce script :
1. ✅ Vérifie toutes les variables d'environnement
2. 🧪 Exécute les tests et le linting
3. 🏗️  Construit l'application
4. 📊 Crée une release Sentry automatique
5. 🗺️  Upload les source maps pour le debugging
6. 🚀 Démarre l'application

### Variables d'environnement requises

- `SENTRY_DSN` : URL de votre projet Sentry
- `SENTRY_AUTH_TOKEN` : Token d'authentification pour l'API Sentry
- `SENTRY_ORG` : Nom de votre organisation Sentry
- `SENTRY_PROJECT` : Nom de votre projet Sentry

### Avantages des releases automatisées

- 🔍 **Debugging amélioré** : Les erreurs sont liées à des versions spécifiques
- 📊 **Suivi des performances** : Comparaison entre versions
- 🚨 **Alertes intelligentes** : Notifications basées sur les releases
- 📈 **Métriques** : Suivi de la santé de chaque déploiement
