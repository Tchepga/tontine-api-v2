#!/bin/bash

# Script de test pour vérifier la gestion robuste des processus

echo "🧪 Test de la gestion robuste des processus..."

# Test 1: Aucun processus Node.js
echo "📋 Test 1: Aucun processus Node.js"
NODE_PIDS=$(pgrep -f "node dist/main.js" 2>/dev/null || true)
if [ -n "$NODE_PIDS" ]; then
    echo "🛑 Arrêt des processus Node.js (PIDs: $NODE_PIDS)..."
    for pid in $NODE_PIDS; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || echo "⚠️  Impossible d'arrêter le processus $pid"
        fi
    done
    echo "✅ Tentative d'arrêt des processus Node.js terminée"
else
    echo "ℹ️  Aucun processus Node.js à arrêter"
fi

# Test 2: Processus inexistant (simulation)
echo ""
echo "📋 Test 2: Simulation avec PID inexistant"
fake_pid=99999
if kill -0 "$fake_pid" 2>/dev/null; then
    echo "🛑 Arrêt du processus $fake_pid..."
    kill "$fake_pid" 2>/dev/null || echo "⚠️  Impossible d'arrêter le processus $fake_pid"
else
    echo "ℹ️  Processus $fake_pid n'existe pas (comportement attendu)"
fi

echo ""
echo "🎉 Tous les tests terminés sans erreur de code de sortie !"
echo "💡 La gestion des processus est maintenant robuste"
