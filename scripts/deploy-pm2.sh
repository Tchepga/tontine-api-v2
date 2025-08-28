#!/bin/bash

# Script de déploiement PM2 pour Tontine API
set -e

echo "🚀 ========================================"
echo "🚀 DÉPLOIEMENT PM2 - TONTINE API"
echo "🚀 ========================================"
echo "📅 Date: $(date)"
echo "👤 Utilisateur: $(whoami)"
echo "📁 Répertoire actuel: $(pwd)"
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "package.json non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

# Vérifier que le build existe
if [ ! -f "dist/main.js" ]; then
    print_error "Le fichier dist/main.js n'existe pas. Exécutez 'npm run build:prod' d'abord."
    exit 1
fi

print_status "Vérification de l'environnement..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm version: $NPM_VERSION"

# Vérifier PM2
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 n'est pas installé, installation en cours..."
    npm install -g pm2
    print_success "PM2 installé"
else
    PM2_VERSION=$(pm2 --version)
    print_success "PM2 version: $PM2_VERSION"
fi

echo ""

# Créer le dossier de logs
print_status "Création du dossier de logs..."
mkdir -p logs
chmod 755 logs
print_success "Dossier de logs créé"

# Installer les dépendances de production
print_status "Installation des dépendances de production..."
if npm ci --only=production; then
    print_success "Dépendances installées"
else
    print_error "Échec de l'installation des dépendances"
    exit 1
fi

echo ""

# Arrêter l'application existante
print_status "Arrêt de l'application existante..."
pm2 stop tontine-api 2>/dev/null || print_warning "Aucune application à arrêter"
pm2 delete tontine-api 2>/dev/null || print_warning "Aucune application à supprimer"
print_success "Application existante nettoyée"

# Démarrer l'application avec PM2
print_status "Démarrage de l'application avec PM2..."
if pm2 start ecosystem.config.js; then
    print_success "Application démarrée avec PM2"
else
    print_error "Échec du démarrage de l'application"
    exit 1
fi

# Sauvegarder la configuration PM2
print_status "Sauvegarde de la configuration PM2..."
pm2 save
print_success "Configuration sauvegardée"

# Configurer le démarrage automatique
print_status "Configuration du démarrage automatique..."
pm2 startup 2>/dev/null || print_warning "Démarrage automatique déjà configuré"
print_success "Démarrage automatique configuré"

echo ""

# Vérification du déploiement
print_status "Vérification du déploiement..."
sleep 5

# Vérifier le statut de l'application
if pm2 list | grep -q 'tontine-api.*online'; then
    print_success "✅ Application en ligne !"
    echo ""
    print_status "📊 Statut des applications PM2:"
    pm2 list
    echo ""
    print_status "📋 Logs récents (10 dernières lignes):"
    pm2 logs tontine-api --lines 10
    echo ""
    
    # Vérifier que l'application répond
    print_status "🔍 Test de connectivité..."
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        print_success "✅ Application répond sur le port 8080"
    else
        print_warning "⚠️  Application ne répond pas encore sur le port 8080"
    fi
else
    print_error "❌ Application non en ligne"
    echo ""
    print_status "📋 Logs d'erreur:"
    pm2 logs tontine-api --lines 20
    exit 1
fi

echo ""
print_success "========================================"
print_success "🎉 DÉPLOIEMENT RÉUSSI !"
print_success "========================================"
echo ""
print_status "Résumé:"
echo "  - ✅ Application démarrée avec PM2"
echo "  - ✅ Configuration sauvegardée"
echo "  - ✅ Démarrage automatique configuré"
echo "  - ✅ Logs disponibles dans ./logs/"
echo ""
print_status "Commandes utiles:"
echo "  - pm2 status          # Voir le statut"
echo "  - pm2 logs tontine-api # Voir les logs"
echo "  - pm2 restart tontine-api # Redémarrer"
echo "  - pm2 stop tontine-api    # Arrêter"
echo ""
print_status "L'application est accessible sur http://localhost:8080"
echo ""
