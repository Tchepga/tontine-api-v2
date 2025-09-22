#!/bin/bash

# Script de test pour vérifier la configuration avant déploiement

echo "🧪 Test de la configuration de déploiement..."

# Vérifier que tous les fichiers nécessaires existent (localement pour la compilation)
echo "📁 Vérification des fichiers..."
required_files=(
    "src/sentry.config.ts"
    "src/main.ts"
    "scripts/deploy/tontine-api.service"
    "scripts/deploy/start-sentry.sh"
    "scripts/deploy/deploy-sentry.sh"
    "scripts/deploy/deploy-robust.sh"
    ".sentryclirc"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file manquant"
        exit 1
    fi
done

# Vérifier que les scripts sont exécutables
echo "🔧 Vérification des permissions..."
scripts=(
    "scripts/deploy/start-sentry.sh"
    "scripts/deploy/deploy-sentry.sh"
    "scripts/deploy/deploy-robust.sh"
)

for script in "${scripts[@]}"; do
    if [ -x "$script" ]; then
        echo "✅ $script est exécutable"
    else
        echo "❌ $script n'est pas exécutable"
        exit 1
    fi
done

# Test de compilation
echo "🏗️  Test de compilation..."
if npm run build; then
    echo "✅ Compilation réussie"
else
    echo "❌ Erreur de compilation"
    exit 1
fi

# Vérifier que le fichier principal existe
if [ -f "dist/main.js" ]; then
    echo "✅ Fichier principal généré"
else
    echo "❌ Fichier principal manquant"
    exit 1
fi

echo "🎉 Tous les tests sont passés !"
echo "🚀 Votre application est prête pour le déploiement."
