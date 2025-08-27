#!/bin/sh

# Script de démarrage pour l'application Tontine API avec PM2

echo "🚀 Démarrage de l'application Tontine API..."

# Vérifier que le dossier dist existe
if [ ! -d "dist" ]; then
    echo "❌ Erreur: Le dossier dist n'existe pas"
    exit 1
fi

# Vérifier que le fichier main.js existe
if [ ! -f "dist/main.js" ]; then
    echo "❌ Erreur: Le fichier dist/main.js n'existe pas"
    exit 1
fi

# Créer le dossier de logs s'il n'existe pas
mkdir -p /tmp/logs

# Nettoyer l'application PM2 existante
echo "🧹 Nettoyage de l'application PM2 existante..."
pm2 delete tontine-api 2>/dev/null || true

# Démarrer l'application avec PM2
echo "📦 Démarrage de l'application avec PM2..."
pm2 start ecosystem.config.js

# Attendre que l'application soit prête
echo "⏳ Attente du démarrage de l'application..."
sleep 10

# Vérifier le statut de l'application
echo "📊 Statut de l'application:"
pm2 status

# Afficher les logs récents
echo "📋 Logs récents:"
pm2 logs --lines 10

# Garder le conteneur en vie et surveiller l'application
echo "👀 Surveillance de l'application..."
pm2-runtime start ecosystem.config.js --no-daemon
