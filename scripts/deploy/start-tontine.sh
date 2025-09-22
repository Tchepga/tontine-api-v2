#!/bin/bash

# Script de démarrage pour l'application Tontine

set -e  # Arrêter le script en cas d'erreur

echo "🚀 ========================================"
echo "🚀 DÉMARRAGE DE L'APPLICATION TONTINE"
echo "🚀 ========================================"
echo "📅 Date: $(date)"
echo "👤 Utilisateur: $(whoami)"
echo "📁 Répertoire actuel: $(pwd)"
echo ""

# Vérification de l'environnement
echo "🔍 VÉRIFICATION DE L'ENVIRONNEMENT"
echo "--------------------------------"
echo "📦 Node.js version: $($NODE_PATH --version)"
echo "📦 NPM version: $($NPM_PATH --version)"
echo "📦 PM2 version: $($PM2_PATH --version)"
echo "📁 Répertoire de travail: $(pwd)"
echo ""

# Aller dans le répertoire de l'application
echo "📁 CHANGEMENT DE RÉPERTOIRE"
echo "---------------------------"
echo "📍 Répertoire cible: /root/apps/tontine"
cd /root/apps/tontine
echo "✅ Répertoire actuel: $(pwd)"
echo "📋 Contenu du répertoire:"
ls -la
echo ""


# Charger fnm et obtenir le chemin de PM2
echo "🔧 CONFIGURATION FNM ET PM2"
echo "--------------------------"
export PATH=\$HOME/.local/share/fnm:\$PATH
eval "\$(/root/.local/share/fnm/fnm env --shell bash)"


# Définir les chemins complets
NODE_PATH="/run/user/0/fnm_multishells/1031057_1756243111113/bin/node"
NPM_PATH="/run/user/0/fnm_multishells/1031057_1756243111113/bin/npm"
PM2_PATH="/run/user/0/fnm_multishells/1031057_1756243111113/bin/pm2"

# Arrêt de l'application existante
echo "🔄 ARRÊT DE L'APPLICATION EXISTANTE"
echo "--------------------------------"
echo "🛑 Arrêt de tontine-api..."
$PM2_PATH stop tontine-api || echo "⚠️  Aucune application à arrêter"
echo "🗑️  Suppression de tontine-api..."
$PM2_PATH delete tontine-api || echo "⚠️  Aucune application à supprimer"
echo "✅ Application existante nettoyée"
echo ""

# Démarrage de l'application
echo "🚀 DÉMARRAGE DE L'APPLICATION"
echo "----------------------------"
echo "🎯 Démarrage de tontine-api..."
$PM2_PATH start main.js --name tontine-api --log /root/apps/tontine/app.log --interpreter $NODE_PATH
echo "✅ Application démarrée"
echo ""

# Configuration PM2
echo "⚙️  CONFIGURATION PM2"
echo "-------------------"
echo "💾 Sauvegarde de la configuration PM2..."
$PM2_PATH save
echo "🔄 Configuration du démarrage automatique..."
$PM2_PATH startup
echo "✅ Configuration PM2 terminée"
echo ""

# Vérification du déploiement
echo "✅ VÉRIFICATION DU DÉPLOIEMENT"
echo "----------------------------"
echo "📊 Statut des applications PM2:"
$PM2_PATH status
echo ""

echo "📋 Logs de l'application (10 dernières lignes):"
$PM2_PATH logs tontine-api --lines 10
echo ""

# Informations finales
echo "🎉 ========================================"
echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo "🎉 ========================================"
echo "📅 Date: $(date)"
echo "🌐 Application accessible sur le port configuré"
echo "📋 Logs disponibles: /root/apps/tontine/app.log"
echo "🔧 Gestion PM2: pm2 status, pm2 logs tontine-api"
echo ""

# Vérification du port d'écoute
echo "🔍 VÉRIFICATION DU PORT D'ÉCOUTE"
echo "-------------------------------"
echo "🌐 Ports en écoute:"
netstat -tlnp | grep LISTEN || echo "Aucun port en écoute détecté"
echo ""

echo "✅ Script de démarrage terminé avec succès !"
