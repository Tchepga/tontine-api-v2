# Documentation et Améliorations du Processus de Déploiement

Ce document décrit le pipeline de déploiement continu pour le projet `tontine-api-v2` et propose des pistes d'amélioration.

---

### **Documentation du Processus de Déploiement Actuel**

#### **1. Vue d'ensemble**

Le processus est entièrement automatisé via GitHub Actions. Chaque `push` sur la branche `master` déclenche un workflow qui construit une nouvelle image Docker de l'application, la publie sur Docker Hub, puis se connecte à un serveur de production pour mettre à jour le service en cours d'exécution.

#### **2. Déclenchement du Workflow**

*   **Événement :** Le workflow est déclenché par un `git push` sur la branche `master`.
*   **Fichier de configuration :** `.github/workflows/deploy_prod.yml`

#### **3. Étapes du Pipeline CI/CD (GitHub Actions)**

Le pipeline se déroule en deux étapes principales sur un runner `ubuntu-latest`.

1.  **Build et Push de l'image Docker :**
    *   Le code source est récupéré (`actions/checkout`).
    *   Le workflow se connecte à Docker Hub en utilisant des secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`).
    *   Une image Docker est construite en se basant sur le `Dockerfile` à la racine du projet.
    *   L'image est taguée `tchep/tontine-api-v2:latest` et poussée sur Docker Hub.

2.  **Déploiement sur le serveur :**
    *   Le workflow se connecte au serveur de production via SSH en utilisant des secrets (`SSH_HOST`, `SSH_USERNAME`, etc.).
    *   Une fois connecté, il exécute le script `start-tontine.sh` situé dans le répertoire `/home/tchep/tontine-api-v2` du serveur.

#### **4. Exécution sur le Serveur de Production**

Le script `start-tontine.sh` orchestre la mise à jour sur le serveur :

1.  Il se connecte à Docker Hub (ce qui est redondant si l'image est publique).
2.  Il télécharge la dernière version de l'image : `docker pull tchep/tontine-api-v2:latest`.
3.  Il utilise `docker-compose` pour arrêter et supprimer l'ancien conteneur (`docker-compose down`). **Cela entraîne une courte période d'indisponibilité (downtime)**.
4.  Il démarre un nouveau conteneur avec la nouvelle image en utilisant la configuration du fichier `docker-compose.yml` (`docker-compose up -d`).
5.  Le `docker-compose.yml` charge les variables d'environnement à partir d'un fichier `.env` présent sur le serveur.
6.  Enfin, le script nettoie les anciennes images Docker non utilisées pour libérer de l'espace disque (`docker image prune -f`).

#### **5. Reverse Proxy avec Caddy**

*   Un conteneur Caddy est configuré (via `caddy/Caddyfile`) pour agir comme reverse proxy.
*   Il redirige le trafic entrant de `tontine.tchep.com` vers le port `3000` du conteneur `tontine-api-v2`.
*   Caddy gère automatiquement la terminaison SSL/TLS, fournissant le HTTPS.

---

### **Points d'Amélioration**

Voici plusieurs suggestions pour rendre votre processus de déploiement plus robuste, sécurisé et efficace.

#### **1. Versioning des Images Docker (Critique)**

*   **Problème :** Vous utilisez le tag `:latest`. C'est une mauvaise pratique car il est imprévisible. Il est difficile de savoir quelle version du code tourne en production et les rollbacks sont compliqués.
*   **Solution :** Taguez vos images avec un identifiant unique et immuable. Le plus simple est d'utiliser le SHA du commit Git.
*   **Implémentation :** Modifiez votre fichier `deploy_prod.yml` :
    ```yaml
    # Dans la section "build and push"
    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: tchep/tontine-api-v2:${{ github.sha }},tchep/tontine-api-v2:latest
    
    # Dans la section "deploy on server", modifiez le script pour utiliser le SHA
    - name: Deploy on server
      uses: appleboy/ssh-action@v1.0.3
      with:
        # ... vos secrets ssh
        script: |
          export APP_VERSION=${{ github.sha }}
          cd /home/tchep/tontine-api-v2
          sh start-tontine.sh
    ```
    Et dans `start-tontine.sh`, utilisez la variable `$APP_VERSION` au lieu de `:latest`.

#### **2. Optimisation du Dockerfile avec un Build Multi-Stage (Bonne Pratique)**

*   **Problème :** Votre image finale contient toutes les dépendances de développement (`devDependencies`) et les outils de build (`npm`, `typescript`), ce qui la rend plus lourde et moins sécurisée que nécessaire.
*   **Solution :** Utilisez un build multi-stage. Une première étape ("builder") construit l'application, et une seconde étape copie uniquement les artéfacts nécessaires dans une image de base "propre".
*   **Implémentation :** Remplacez votre `Dockerfile` par celui-ci :
    ```dockerfile
    # ---- Stage 1: Build ----
    FROM node:18-alpine AS builder
    WORKDIR /usr/src/app
    COPY package*.json ./
    RUN npm install
    COPY . .
    RUN npm run build

    # ---- Stage 2: Production ----
    FROM node:18-alpine
    WORKDIR /usr/src/app
    # Copier les dépendances de production depuis le stage "builder"
    COPY --from=builder /usr/src/app/node_modules ./node_modules
    # Copier l'application compilée depuis le stage "builder"
    COPY --from=builder /usr/src/app/dist ./dist
    # Copier package.json pour référence
    COPY --from=builder /usr/src/app/package.json ./

    EXPOSE 3000
    CMD ["node", "dist/main"]
    ```

#### **3. Déploiement sans Temps d'Arrêt (Zero-Downtime)**

*   **Problème :** La séquence `docker-compose down` puis `up` crée une interruption de service.
*   **Solution :** Mettez à jour le service sans l'arrêter. `docker-compose` peut le faire nativement.
*   **Implémentation :** Modifiez votre script `start-tontine.sh` pour éviter le `down`.
    ```bash
    #!/bin/bash
    set -e # Arrête le script si une commande échoue

    # La variable APP_VERSION est définie par la GitHub Action
    IMAGE_TAG="tchep/tontine-api-v2:${APP_VERSION:-latest}"

    echo "Déploiement de l'image $IMAGE_TAG"

    # Pull de la nouvelle image
    docker pull $IMAGE_TAG

    # Mise à jour du service en cours d'exécution sans l'arrêter
    # Docker-compose va recréer uniquement les conteneurs dont l'image a changé
    docker-compose up -d --remove-orphans

    # Nettoyage des anciennes images
    docker image prune -f
    ```
    **Note :** Pour que cela fonctionne, votre `docker-compose.yml` doit utiliser une variable pour le tag de l'image, qui sera lue depuis le fichier `.env` mis à jour par votre pipeline.

#### **4. Gestion des Secrets et de la Configuration**

*   **Problème :** Le fichier `.env` est géré manuellement sur le serveur, ce qui peut entraîner des erreurs et des oublis. Le `docker login` dans le script est aussi un risque de sécurité mineur (historique du shell).
*   **Solution :** Générez le fichier `.env` directement depuis la GitHub Action en utilisant les secrets du repository.
*   **Implémentation :** Dans votre étape `deploy on server` :
    ```yaml
    - name: Deploy on server
      uses: appleboy/ssh-action@v1.0.3
      with:
        # ... vos secrets ssh
        script: |
          cd /home/tchep/tontine-api-v2
          
          # Création du fichier .env à partir des secrets GitHub
          echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" > .env
          echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> .env
          # ... ajoutez toutes vos variables d'environnement
          
          # Définition de la version de l'image à déployer
          echo "IMAGE_TAG=tchep/tontine-api-v2:${{ github.sha }}" >> .env

          # Lancement du script de déploiement (qui n'a plus besoin de gérer les versions)
          sh start-tontine.sh 
    ```
    Votre `docker-compose.yml` et `start-tontine.sh` utiliseront alors ces variables.
