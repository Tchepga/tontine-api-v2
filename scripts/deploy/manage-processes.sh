#!/bin/bash

# Script utilitaire pour gérer les processus Node.js
# Utilise grep et pkill pour une gestion simple

case "$1" in
    "status")
        echo "📊 Statut des processus Node.js:"
        ps aux | grep "node dist/main.js" | grep -v grep || echo "Aucun processus Node.js en cours"
        ;;
    "stop")
        echo "🛑 Arrêt des processus Node.js..."
        pkill -f "node dist/main.js" && echo "Processus arrêtés" || echo "Aucun processus à arrêter"
        ;;
    "restart")
        echo "🔄 Redémarrage des processus Node.js..."
        pkill -f "node dist/main.js" 2>/dev/null || true
        sleep 2
        nohup node dist/main.js > logs/app.log 2>&1 &
        echo $! > logs/app.pid
        echo "Processus redémarré avec PID: $!"
        ;;
    "logs")
        echo "📋 Logs des processus Node.js:"
        tail -f logs/app.log
        ;;
    "pid")
        if [ -f logs/app.pid ]; then
            echo "🆔 PID du processus principal: $(cat logs/app.pid)"
        else
            echo "❌ Fichier PID non trouvé"
        fi
        ;;
    *)
        echo "Usage: $0 {status|stop|restart|logs|pid}"
        echo "  status  - Afficher le statut des processus"
        echo "  stop    - Arrêter tous les processus Node.js"
        echo "  restart - Redémarrer l'application"
        echo "  logs    - Suivre les logs en temps réel"
        echo "  pid     - Afficher le PID du processus principal"
        exit 1
        ;;
esac
