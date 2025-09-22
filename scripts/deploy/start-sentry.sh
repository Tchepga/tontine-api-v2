#!/bin/bash

# Script de démarrage avec Sentry pour l'API Tontine
# Remplace PM2 par un démarrage simple avec gestion des erreurs

echo "🚀 Démarrage de l'API Tontine avec Sentry..."

# Vérifier que les variables d'environnement sont définies
if [ -z "$SENTRY_DSN" ]; then
    echo "⚠️  Attention: SENTRY_DSN n'est pas défini. Sentry ne fonctionnera pas correctement."
    echo "   Ajoutez SENTRY_DSN=votre-dsn dans votre fichier .env"
fi

# Construire l'application
echo "📦 Construction de l'application..."
npm run build:prod

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction. Arrêt."
    exit 1
fi

echo "✅ Construction réussie!"

# Démarrer l'application
echo "🌐 Démarrage du serveur sur le port 8080..."
echo "📊 Sentry est configuré pour capturer les erreurs et les performances"
echo "🔍 Consultez votre dashboard Sentry pour voir les données"

# Démarrer avec gestion des erreurs
node dist/main.js

# Si on arrive ici, c'est que l'application s'est arrêtée
echo "🛑 L'application s'est arrêtée"
