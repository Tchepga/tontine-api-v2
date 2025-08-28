#!/bin/bash

# Script de validation des tests pour le déploiement
set -e

echo "🧪 ========================================"
echo "🧪 VALIDATION DES TESTS AVANT DÉPLOIEMENT"
echo "🧪 ========================================"
echo "📅 Date: $(date)"
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

echo ""

# Installation des dépendances
print_status "Installation des dépendances..."
if npm ci --silent; then
    print_success "Dépendances installées avec succès"
else
    print_error "Échec de l'installation des dépendances"
    exit 1
fi

echo ""

# Vérification du linting
print_status "Vérification du linting..."
if npm run lint --silent; then
    print_success "Linting passé avec succès"
else
    print_error "Échec du linting"
    exit 1
fi

echo ""

# Exécution des tests unitaires
print_status "Exécution des tests unitaires..."
if npm run test:cov --silent; then
    print_success "Tests unitaires passés avec succès"
else
    print_error "Échec des tests unitaires"
    exit 1
fi

echo ""

# Vérification de la couverture de code
print_status "Vérification de la couverture de code..."
COVERAGE_FILE="coverage/lcov-report/index.html"
if [ -f "$COVERAGE_FILE" ]; then
    print_success "Rapport de couverture généré"
    print_status "Rapport disponible dans: $COVERAGE_FILE"
else
    print_warning "Rapport de couverture non trouvé"
fi

echo ""

# Exécution des tests E2E
print_status "Exécution des tests E2E..."
if npm run test:e2e --silent; then
    print_success "Tests E2E passés avec succès"
else
    print_error "Échec des tests E2E"
    exit 1
fi

echo ""

# Build de l'application
print_status "Build de l'application..."
if npm run build:prod --silent; then
    print_success "Build réussi"
else
    print_error "Échec du build"
    exit 1
fi

echo ""

# Vérification des fichiers de build
print_status "Vérification des fichiers de build..."
if [ -d "dist" ] && [ -f "dist/main.js" ]; then
    print_success "Fichiers de build générés correctement"
else
    print_error "Fichiers de build manquants"
    exit 1
fi

echo ""

# Vérification de la taille du build
BUILD_SIZE=$(du -sh dist | cut -f1)
print_status "Taille du build: $BUILD_SIZE"

echo ""

# Résumé final
print_success "========================================"
print_success "✅ TOUS LES TESTS SONT PASSÉS !"
print_success "✅ L'application est prête pour le déploiement"
print_success "========================================"

echo ""
print_status "Résumé:"
echo "  - ✅ Linting: OK"
echo "  - ✅ Tests unitaires: OK"
echo "  - ✅ Tests E2E: OK"
echo "  - ✅ Build: OK"
echo "  - ✅ Couverture de code: Générée"
echo ""

print_status "L'application peut maintenant être déployée en toute sécurité !"
echo ""
