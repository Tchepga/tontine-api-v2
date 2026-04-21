#!/bin/bash

# Script de démarrage simple pour le développement
# Sans tests ni linting pour un démarrage rapide

echo "🚀 Démarrage de l'API Tontine en mode développement..."

# Vérifier que les variables d'environnement sont définies
if [ -z "$SENTRY_DSN" ]; then
    echo "⚠️  Attention: SENTRY_DSN n'est pas défini. Sentry ne fonctionnera pas correctement."
    echo "   Ajoutez SENTRY_DSN=votre-dsn dans votre fichier .env"
fi

# Construction simple
echo "📦 Construction de l'application..."
npm run build

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
