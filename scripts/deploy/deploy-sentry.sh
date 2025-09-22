#!/bin/bash

# Script de déploiement avec Sentry pour l'API Tontine
# Utilise SENTRY_AUTH_TOKEN pour automatiser les releases

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement de l'API Tontine"

# Vérifier les variables d'environnement requises
if [ -z "$SENTRY_DSN" ]; then
    echo "❌ Erreur: SENTRY_DSN n'est pas défini"
    exit 1
fi

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
    echo "❌ Erreur: SENTRY_AUTH_TOKEN n'est pas défini"
    exit 1
fi

if [ -z "$SENTRY_ORG" ]; then
    echo "❌ Erreur: SENTRY_ORG n'est pas défini"
    exit 1
fi

if [ -z "$SENTRY_PROJECT" ]; then
    echo "❌ Erreur: SENTRY_PROJECT n'est pas défini"
    exit 1
fi

# Générer un numéro de version basé sur la date et le commit
VERSION=$(date +"%Y%m%d-%H%M%S")-$(git rev-parse --short HEAD)
export SENTRY_RELEASE=$VERSION
echo "📦 Version: $VERSION"

# Installation des dépendances
echo "📥 Installation des dépendances..."
npm ci --only=production

# Tests et linting
echo "🧪 Exécution des tests..."
npm run test:cov

echo "🔍 Vérification du code..."
npm run lint

# Construction de l'application
echo "🏗️  Construction de l'application..."
npm run build:prod

# Créer une release Sentry
echo "📊 Création de la release Sentry..."
npx @sentry/cli releases new $VERSION \
    --org $SENTRY_ORG \
    --project $SENTRY_PROJECT \
    --auth-token $SENTRY_AUTH_TOKEN

# Uploader les source maps
echo "🗺️  Upload des source maps..."
npx @sentry/cli releases files $VERSION upload-sourcemaps dist \
    --org $SENTRY_ORG \
    --project $SENTRY_PROJECT \
    --auth-token $SENTRY_AUTH_TOKEN

# Finaliser la release
echo "✅ Finalisation de la release..."
npx @sentry/cli releases finalize $VERSION \
    --org $SENTRY_ORG \
    --project $SENTRY_PROJECT \
    --auth-token $SENTRY_AUTH_TOKEN

echo "🎉 Déploiement terminé avec succès!"
echo "📊 Release Sentry: $VERSION"
echo "🔍 Consultez votre dashboard Sentry pour voir la release"

# Démarrer l'application
echo "🚀 Démarrage de l'application..."
node dist/main.js
