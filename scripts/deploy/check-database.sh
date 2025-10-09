#!/bin/bash

# Script de vérification de la base de données après déploiement

echo "🔍 Vérification de la base de données après déploiement..."

# Vérifier que l'application est construite
if [ ! -f "dist/main.js" ]; then
    echo "❌ Application non construite. Exécutez 'npm run build' d'abord."
    exit 1
fi

# Vérifier la connexion à la base de données
echo "📊 Test de connexion à la base de données..."
npm run check:database

if [ $? -eq 0 ]; then
    echo "✅ Base de données accessible et tables créées"
else
    echo "❌ Problème avec la base de données"
    echo "📋 Vérifiez les variables d'environnement :"
    echo "   - DB_HOST: ${DB_HOST:-localhost}"
    echo "   - DB_PORT: ${DB_PORT:-3306}"
    echo "   - DB_USERNAME: ${DB_USERNAME:-root}"
    echo "   - DB_DATABASE: ${DB_DATABASE:-tontine}"
    echo "   - DB_SYNCHRONIZE: ${DB_SYNCHRONIZE:-true}"
    exit 1
fi

echo "🎉 Vérification de la base de données terminée avec succès"
