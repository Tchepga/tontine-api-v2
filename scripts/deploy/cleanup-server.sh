#!/bin/bash

# Script de nettoyage du serveur de production
# Supprime les dossiers src/ et node_modules/ du répertoire de déploiement

echo "🧹 Nettoyage du serveur de production..."

# Vérifier que nous sommes sur le serveur de production
if [ ! -d "/root/apps/tontine" ]; then
    echo "❌ Ce script doit être exécuté sur le serveur de production"
    echo "💡 Utilisez: ssh user@server 'cd /root/apps/tontine && ./scripts/deploy/cleanup-server.sh'"
    exit 1
fi

# Aller dans le répertoire de l'application
cd /root/apps/tontine

echo "📁 Répertoire actuel: $(pwd)"
echo "📋 Contenu avant nettoyage:"
ls -la

# Nettoyer les dossiers inutiles
echo "🗑️  Suppression des dossiers inutiles..."

if [ -d "src" ]; then
    echo "   - Suppression de src/"
    rm -rf src/
    echo "   ✅ src/ supprimé"
else
    echo "   ℹ️  src/ n'existe pas"
fi

# Note: node_modules/ est maintenant inclus dans dist/ et ne doit pas être supprimé
echo "   ℹ️  node_modules/ est inclus dans dist/ et conservé"

# Nettoyer d'autres dossiers potentiellement inutiles
for dir in "coverage" "test" "docs" ".git"; do
    if [ -d "$dir" ]; then
        echo "   - Suppression de $dir/"
        rm -rf "$dir"
        echo "   ✅ $dir/ supprimé"
    fi
done

echo ""
echo "📋 Contenu après nettoyage:"
ls -la

echo ""
echo "💾 Espace disque libéré:"
df -h /root/apps/tontine

echo ""
echo "🎉 Nettoyage terminé !"
echo "📝 Seuls les fichiers nécessaires à la production sont conservés:"
echo "   - dist/ (code compilé + node_modules inclus)"
echo "   - scripts/deploy/ (scripts de déploiement)"
echo "   - Configuration (tsconfig.json, etc.)"
echo "   - caddy/ (configuration du serveur web)"
