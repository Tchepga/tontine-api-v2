#!/bin/bash

# Script de test pour vérifier que le bundle de production fonctionne

echo "🧪 Test du bundle de production..."

# Aller dans le répertoire dist
cd dist

# Vérifier que les fichiers nécessaires existent
echo "📁 Vérification des fichiers..."
required_files=(
    "main.js"
    "node_modules"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ] || [ -d "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file manquant"
        exit 1
    fi
done

# Vérifier que node_modules contient les dépendances essentielles
echo "📦 Vérification des dépendances..."
essential_deps=(
    "node_modules/@nestjs"
    "node_modules/typeorm"
    "node_modules/mysql2"
    "node_modules/bcrypt"
)

for dep in "${essential_deps[@]}"; do
    if [ -d "$dep" ]; then
        echo "✅ $dep"
    else
        echo "❌ $dep manquant"
        exit 1
    fi
done

# Test de démarrage rapide (avec timeout)
echo "🚀 Test de démarrage de l'application..."
timeout 10s NODE_PATH=./node_modules node main.js > /dev/null 2>&1 &
APP_PID=$!

# Attendre un peu pour voir si l'application démarre
sleep 3

# Vérifier si le processus est toujours en cours
if kill -0 $APP_PID 2>/dev/null; then
    echo "✅ Application démarrée avec succès"
    # Arrêter l'application
    kill $APP_PID 2>/dev/null
    wait $APP_PID 2>/dev/null
else
    echo "❌ Application n'a pas pu démarrer"
    exit 1
fi

echo ""
echo "🎉 Bundle de production testé avec succès !"
echo "📋 Résumé:"
echo "   - Fichiers principaux: ✅"
echo "   - Dépendances essentielles: ✅"
echo "   - Démarrage de l'application: ✅"
echo ""
echo "🚀 Le bundle est prêt pour le déploiement !"
