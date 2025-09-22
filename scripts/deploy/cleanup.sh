#!/bin/bash

# Script de nettoyage pour résoudre les conflits de port

echo "🧹 Nettoyage du système..."

# Arrêter tous les processus Node.js
echo "🛑 Arrêt des processus Node.js..."
pkill -f "node dist/main.js" 2>/dev/null || echo "Aucun processus Node.js à arrêter"

# Arrêter le service systemd
echo "🛑 Arrêt du service systemd..."
systemctl stop tontine-api.service 2>/dev/null || echo "Aucun service à arrêter"

# Vérifier qui utilise le port 8080
echo "🔍 Vérification du port 8080..."
if lsof -i :8080 > /dev/null 2>&1; then
    echo "⚠️  Le port 8080 est utilisé par:"
    lsof -i :8080
    echo "🔄 Libération du port..."
    kill -9 $(lsof -t -i:8080) 2>/dev/null || echo "Port libéré"
else
    echo "✅ Port 8080 libre"
fi

# Nettoyer les fichiers temporaires
echo "🧹 Nettoyage des fichiers..."
rm -f logs/app.pid
rm -f logs/app.log

# Recréer le dossier de logs
mkdir -p logs

echo "✅ Nettoyage terminé !"
echo "🚀 Vous pouvez maintenant redéployer avec: npm run deploy:simple"
