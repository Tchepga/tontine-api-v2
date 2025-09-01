#!/bin/bash

# Script de déploiement ultra-simplifié avec Sentry
# Utilise grep et pkill pour une gestion simple des processus

echo "🚀 Déploiement simplifié de l'API Tontine..."

# Vérifier les variables essentielles
if [ -z "$SENTRY_DSN" ]; then
    echo "⚠️  SENTRY_DSN non défini - Sentry désactivé"
fi

# Créer le dossier de logs
mkdir -p logs

# Arrêter l'ancienne application (simplifié)
echo "🔄 Arrêt de l'ancienne application..."
pkill -f "node dist/main.js" 2>/dev/null || echo "Aucun processus à arrêter"
systemctl stop tontine-api.service 2>/dev/null || echo "Aucun service à arrêter"

# Construction
echo "📦 Construction..."
npm run build

# Démarrer l'application
echo "🚀 Démarrage..."
nohup node dist/main.js > logs/app.log 2>&1 &
echo $! > logs/app.pid

# Vérification simple
echo "✅ Vérification..."
sleep 3
if curl -s http://localhost:8080/health > /dev/null; then
    echo "🎉 Déploiement réussi!"
else
    echo "❌ Erreur de déploiement"
    exit 1
fi
