# Documentation et Améliorations du Processus de Déploiement

Ce document décrit le pipeline de déploiement continu pour le projet `tontine-api-v2` et propose des pistes d'amélioration.

---

### **Documentation du Processus de Déploiement Actuel**

#### **1. Vue d'ensemble**

Le processus est entièrement automatisé via GitHub Actions. Chaque `push` sur la branche `deploy` déclenche un workflow qui construit l'application, exécute les tests, puis se connecte à un serveur de production pour déployer l'application avec PM2.

#### **2. Déclenchement du Workflow**

*   **Événement :** Le workflow est déclenché par un `git push` sur la branche `deploy`.
*   **Fichier de configuration :** `.github/workflows/deploy_prod.yml`

#### **3. Étapes du Pipeline CI/CD (GitHub Actions)**

Le pipeline se déroule en plusieurs étapes sur un runner `ubuntu-latest`.

1.  **Setup et Tests :**
    *   Le code source est récupéré (`actions/checkout`).
    *   Node.js 20.x est configuré (`actions/setup-node`).
    *   Les dépendances sont installées (`npm ci`).
    *   Les tests de linting sont exécutés (`npm run lint`).
    *   Les tests unitaires sont exécutés avec couverture (`npm run test:cov`).
    *   Les tests E2E sont exécutés (`npm run test:e2e`).
    *   L'application est compilée pour la production (`npm run build:prod`).

2.  **Déploiement sur le serveur :**
    *   Le workflow se connecte au serveur de production via SSH en utilisant des secrets (`SSH_KEY_VPS_HOSTINGER`, `HOST_VPS_HOSTINGER`, etc.).
    *   Une archive tar.gz est créée avec tous les fichiers nécessaires (excluant `node_modules`, `.git`, etc.).
    *   L'archive est transférée sur le serveur via SCP.
    *   Le script de déploiement PM2 est exécuté sur le serveur.

#### **4. Exécution sur le Serveur de Production**

Le script de déploiement orchestre la mise à jour sur le serveur :

1.  **Préparation de l'environnement :**
    *   Vérification et installation de Node.js 20.x si nécessaire.
    *   Vérification et installation de PM2 si nécessaire.
    *   Sauvegarde de l'ancienne version pour rollback.

2.  **Déploiement de l'application :**
    *   Extraction de l'archive tar.gz.
    *   Copie du fichier d'environnement de production.
    *   Installation des dépendances de production (`npm ci --only=production`).
    *   Arrêt de l'application PM2 existante.
    *   Démarrage de la nouvelle version avec PM2.
    *   Sauvegarde de la configuration PM2.
    *   Configuration du démarrage automatique.

3.  **Vérification et rollback :**
    *   Vérification que l'application fonctionne correctement.
    *   En cas d'échec, restauration automatique de l'ancienne version.
    *   Nettoyage des fichiers temporaires.

#### **5. Configuration PM2**

L'application utilise PM2 pour la gestion des processus en production :

*   **Fichier de configuration :** `ecosystem.config.js`
*   **Nom de l'application :** `tontine-api`
*   **Port :** 8080
*   **Mode d'exécution :** `fork` (une seule instance)
*   **Redémarrage automatique :** Activé
*   **Logs :** Stockés dans `./logs/`
*   **Monitoring :** Intégré avec PM2

#### **6. Reverse Proxy avec Caddy**

*   Caddy est utilisé comme reverse proxy pour gérer HTTPS.
*   Il redirige le trafic entrant de `api.tontine.devcoorp.net` vers le port `8080` de l'application.
*   Caddy gère automatiquement la terminaison SSL/TLS.
*   Configuration en mode processus pour éviter les conflits avec d'autres applications.

---

### **Avantages du Déploiement PM2 vs Docker**

#### **Avantages PM2 :**
*   **Simplicité :** Pas de conteneurs, configuration plus directe
*   **Légèreté :** Moins de ressources système utilisées
*   **Rapidité :** Déploiement plus rapide
*   **Débogage :** Logs directs, plus facile à diagnostiquer
*   **Flexibilité :** Plus facile de modifier la configuration
*   **Monitoring :** Interface PM2 intégrée

#### **Avantages Docker :**
*   **Isolation :** Environnement complètement isolé
*   **Portabilité :** Fonctionne identiquement sur tous les environnements
*   **Versioning :** Gestion des versions d'images
*   **Scalabilité :** Plus facile de scaler horizontalement

---

### **Points d'Amélioration**

Voici plusieurs suggestions pour rendre votre processus de déploiement plus robuste, sécurisé et efficace.

#### **1. Versioning des Déploiements (Critique)**

*   **Problème :** Il n'y a pas de versioning explicite des déploiements, ce qui rend les rollbacks difficiles.
*   **Solution :** Utilisez le SHA du commit Git comme identifiant de version.
*   **Implémentation :** Modifiez votre fichier `deploy_prod.yml` :
    ```yaml
    # Dans la section "Deploy to server with PM2"
    - name: Deploy to server with PM2
      run: |
        # ... configuration SSH ...
        
        # Ajouter le SHA du commit dans l'archive
        echo "${{ github.sha }}" > VERSION
        tar -czf deploy.tar.gz \
          --exclude='node_modules' \
          --exclude='.git' \
          --exclude='.env' \
          --exclude='upload' \
          --exclude='test' \
          --exclude='docs' \
          --exclude='google-cloud-sdk' \
          --exclude='deploy.tar.gz' \
          --exclude='coverage' \
          VERSION \
          ecosystem.config.js \
          # ... autres fichiers ...
    ```

#### **2. Gestion des Secrets et de la Configuration**

*   **Problème :** Le fichier `.env` est géré manuellement sur le serveur, ce qui peut entraîner des erreurs et des oublis.
*   **Solution :** Générez le fichier `.env` directement depuis la GitHub Action en utilisant les secrets du repository.
*   **Implémentation :** Dans votre étape de déploiement :
    ```yaml
    # Création du fichier .env à partir des secrets GitHub
    ssh -i ~/.ssh/deploy_key ${{ secrets.HOST_VPS_USER }}@${{ secrets.HOST_VPS_HOSTINGER }} "
      # ... autres commandes ...
      
      # Création du fichier .env à partir des secrets
      cat > .env << EOF
      DATABASE_URL=${{ secrets.DATABASE_URL }}
      JWT_SECRET=${{ secrets.JWT_SECRET }}
      NODE_ENV=production
      PORT=8080
      # ... autres variables d'environnement ...
      EOF
      
      # ... suite du déploiement ...
    "
    ```

#### **3. Monitoring et Alertes**

*   **Problème :** Pas de monitoring automatique des performances et de la santé de l'application.
*   **Solution :** Intégrer un système de monitoring avec PM2 et des alertes.
*   **Implémentation :**
    ```bash
    # Configuration PM2 avec monitoring
    pm2 install pm2-server-monit
    pm2 set pm2-server-monit:email your-email@example.com
    
    # Script de vérification de santé
    #!/bin/bash
    if ! curl -f http://localhost:8080/health > /dev/null 2>&1; then
      echo "Application down!" | mail -s "Alert: Tontine API Down" your-email@example.com
      pm2 restart tontine-api
    fi
    ```

#### **4. Déploiement sans Temps d'Arrêt (Zero-Downtime)**

*   **Problème :** Le redémarrage de l'application crée une courte interruption de service.
*   **Solution :** Utiliser le reload PM2 pour un redémarrage sans interruption.
*   **Implémentation :** Modifiez le script de déploiement :
    ```bash
    # Au lieu de stop/start, utiliser reload
    if pm2 list | grep -q 'tontine-api.*online'; then
      echo "Reloading application..."
      pm2 reload tontine-api
    else
      echo "Starting application..."
      pm2 start ecosystem.config.js
    fi
    ```

#### **5. Sauvegarde et Rollback Automatisés**

*   **Problème :** Le rollback manuel peut être complexe et prendre du temps.
*   **Solution :** Automatiser le processus de sauvegarde et de rollback.
*   **Implémentation :**
    ```bash
    # Script de rollback automatique
    #!/bin/bash
    if [ "$1" = "rollback" ]; then
      echo "Rolling back to previous version..."
      cd /root/apps
      if [ -d "tontine.old" ]; then
        rm -rf tontine
        mv tontine.old tontine
        cd tontine
        pm2 start ecosystem.config.js
        echo "Rollback completed successfully"
      else
        echo "No previous version available for rollback"
        exit 1
      fi
    fi
    ```

#### **6. Tests de Régression Automatisés**

*   **Problème :** Pas de vérification automatique que l'application fonctionne correctement après déploiement.
*   **Solution :** Ajouter des tests de santé et de régression après le déploiement.
*   **Implémentation :**
    ```yaml
    # Dans le workflow GitHub Actions
    - name: Health Check
      run: |
        ssh -i ~/.ssh/deploy_key ${{ secrets.HOST_VPS_USER }}@${{ secrets.HOST_VPS_HOSTINGER }} "
          sleep 30  # Attendre que l'application démarre
          
          # Test de santé
          if curl -f http://localhost:8080/health; then
            echo 'Health check passed'
          else
            echo 'Health check failed'
            exit 1
          fi
          
          # Tests de régression
          curl -f http://localhost:8080/api/tontine || exit 1
          curl -f http://localhost:8080/api/auth/login || exit 1
        "
    ```

#### **7. Logs Centralisés**

*   **Problème :** Les logs sont dispersés et difficiles à consulter.
*   **Solution :** Centraliser les logs avec un système comme ELK Stack ou un service cloud.
*   **Implémentation :**
    ```bash
    # Configuration PM2 pour logs centralisés
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
    pm2 set pm2-logrotate:compress true
    ```

#### **8. Sécurité Renforcée**

*   **Problème :** L'application tourne avec des permissions élevées.
*   **Solution :** Utiliser un utilisateur dédié et des permissions minimales.
*   **Implémentation :**
    ```bash
    # Créer un utilisateur dédié
    sudo useradd -r -s /bin/false tontine-app
    
    # Modifier ecosystem.config.js
    module.exports = {
      apps: [{
        name: 'tontine-api',
        script: 'dist/main.js',
        user: 'tontine-app',
        group: 'tontine-app',
        # ... autres configurations
      }]
    };
    ```

---

### **Commandes Utiles**

#### **Gestion PM2 :**
```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs tontine-api

# Redémarrer
pm2 restart tontine-api

# Arrêter
pm2 stop tontine-api

# Monitoring en temps réel
pm2 monit

# Interface web
pm2 web
```

#### **Déploiement Manuel :**
```bash
# Déploiement complet
npm run deploy:pm2:local

# Build uniquement
npm run build:prod

# Tests uniquement
npm run test:validate
```

#### **Maintenance :**
```bash
# Vérifier l'espace disque
df -h

# Vérifier l'utilisation mémoire
free -h

# Vérifier les processus
ps aux | grep node

# Nettoyer les logs
pm2 flush
```

---

### **Conclusion**

Le passage de Docker à PM2 a simplifié significativement le processus de déploiement tout en conservant la robustesse et la fiabilité. Les améliorations proposées permettront d'optimiser davantage le pipeline CI/CD et d'améliorer la maintenance de l'application en production.

**Note :** Ce document remplace l'ancienne documentation Docker. L'application utilise maintenant PM2 pour un déploiement plus simple et plus efficace.
